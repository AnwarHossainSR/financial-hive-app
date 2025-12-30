-- Add notifications table to the existing migration
-- This should be added to your existing migration file

-- Create notification types enum (idempotent)
DO $$ BEGIN
    CREATE TYPE public.notification_type AS ENUM ('info', 'success', 'warning', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create notifications table (idempotent)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT '{}', -- For storing additional data like transaction_id, book_id, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Disable RLS on notifications table (idempotent)
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Create trigger for updating timestamps (idempotent)
DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance (idempotent)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Realtime enablement for notifications removed.

-- Function to create notification (helper function)
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type notification_type DEFAULT 'info',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, metadata)
  VALUES (p_user_id, p_title, p_message, p_type, p_metadata)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to auto-cleanup old notifications (optional)
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete notifications older than 30 days
  DELETE FROM public.notifications 
  WHERE created_at < now() - INTERVAL '30 days';
  
  -- Keep only the latest 100 notifications per user
  DELETE FROM public.notifications 
  WHERE id IN (
    SELECT id FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
      FROM public.notifications
    ) ranked
    WHERE rn > 100
  );
END;
$$;


-- Database function to check budget and create notifications
-- Add this to your migration file

CREATE OR REPLACE FUNCTION public.check_budget_and_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    budget_record RECORD;
    current_month TEXT;
    total_expenses DECIMAL;
    budget_percentage DECIMAL;
    book_name TEXT;
    existing_notification_id UUID;
BEGIN
    -- Only check for expense transactions
    IF NEW.type != 'expense' THEN
        RETURN NEW;
    END IF;

    -- Get current month in YYYY-MM format
    current_month := TO_CHAR(NEW.date, 'YYYY-MM');

    -- Get the budget for this book and month
    SELECT amount INTO budget_record
    FROM public.monthly_budgets
    WHERE book_id = NEW.book_id AND month = current_month;

    -- If no budget is set, skip notification
    IF budget_record IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get book name
    SELECT name INTO book_name
    FROM public.books
    WHERE id = NEW.book_id;

    -- Calculate total expenses for this month
    SELECT COALESCE(SUM(amount), 0) INTO total_expenses
    FROM public.transactions
    WHERE book_id = NEW.book_id
    AND type = 'expense'
    AND TO_CHAR(date, 'YYYY-MM') = current_month;

    -- Calculate percentage of budget used
    budget_percentage := (total_expenses / budget_record.amount) * 100;

    -- Check if we need to send a notification
    IF budget_percentage >= 80 THEN
        -- Check if we already sent a notification for this month and threshold
        SELECT id INTO existing_notification_id
        FROM public.notifications
        WHERE user_id = NEW.user_id
        AND metadata->>'action' = 'budget_alert'
        AND metadata->>'month' = current_month
        AND metadata->>'book_id' = NEW.book_id::text
        AND (
            (budget_percentage >= 100 AND metadata->>'threshold' = '100') OR
            (budget_percentage >= 80 AND budget_percentage < 100 AND metadata->>'threshold' = '80')
        );

        -- Only create notification if we haven't already sent one for this threshold
        IF existing_notification_id IS NULL THEN
            DECLARE
                notification_title TEXT;
                notification_message TEXT;
                notification_type notification_type;
                threshold_value TEXT;
            BEGIN
                IF budget_percentage >= 100 THEN
                    notification_type := 'error';
                    notification_title := 'Budget Exceeded!';
                    notification_message := 'You have exceeded your monthly budget of ৳' || budget_record.amount || ' in "' || book_name || '". Current spending: ৳' || total_expenses;
                    threshold_value := '100';
                ELSE
                    notification_type := 'warning';
                    notification_title := 'Budget Alert';
                    notification_message := 'You have used ' || ROUND(budget_percentage, 1) || '% of your ৳' || budget_record.amount || ' budget in "' || book_name || '"';
                    threshold_value := '80';
                END IF;

                -- Create the notification
                INSERT INTO public.notifications (
                    user_id,
                    title,
                    message,
                    type,
                    metadata
                ) VALUES (
                    NEW.user_id,
                    notification_title,
                    notification_message,
                    notification_type,
                    jsonb_build_object(
                        'action', 'budget_alert',
                        'book_id', NEW.book_id,
                        'month', current_month,
                        'budget_amount', budget_record.amount,
                        'spent_amount', total_expenses,
                        'percentage', budget_percentage,
                        'threshold', threshold_value
                    )
                );
            END;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger to check budget on transaction insert/update
DROP TRIGGER IF EXISTS budget_check_trigger ON public.transactions;
CREATE TRIGGER budget_check_trigger
    AFTER INSERT OR UPDATE OF amount, type, book_id, date
    ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.check_budget_and_notify();

-- Function to manually check all budgets (can be called periodically)
CREATE OR REPLACE FUNCTION public.check_all_budgets_and_notify()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    budget_record RECORD;
    total_expenses DECIMAL;
    budget_percentage DECIMAL;
    notifications_created INTEGER := 0;
    current_month TEXT;
BEGIN
    current_month := TO_CHAR(CURRENT_DATE, 'YYYY-MM');

    -- Loop through all active budgets for current month
    FOR budget_record IN
        SELECT 
            mb.book_id,
            mb.amount as budget_amount,
            mb.month,
            b.name as book_name,
            b.owner_id as user_id
        FROM public.monthly_budgets mb
        JOIN public.books b ON mb.book_id = b.id
        WHERE mb.month = current_month
    LOOP
        -- Calculate total expenses for this book and month
        SELECT COALESCE(SUM(amount), 0) INTO total_expenses
        FROM public.transactions
        WHERE book_id = budget_record.book_id
        AND type = 'expense'
        AND TO_CHAR(date, 'YYYY-MM') = current_month;

        -- Calculate percentage
        budget_percentage := (total_expenses / budget_record.budget_amount) * 100;

        -- Create notification if over 80% and not already notified
        IF budget_percentage >= 80 THEN
            IF NOT EXISTS (
                SELECT 1 FROM public.notifications
                WHERE user_id = budget_record.user_id
                AND metadata->>'action' = 'budget_alert'
                AND metadata->>'month' = current_month
                AND metadata->>'book_id' = budget_record.book_id::text
                AND (
                    (budget_percentage >= 100 AND metadata->>'threshold' = '100') OR
                    (budget_percentage >= 80 AND budget_percentage < 100 AND metadata->>'threshold' = '80')
                )
            ) THEN
                DECLARE
                    notification_title TEXT;
                    notification_message TEXT;
                    notification_type notification_type;
                    threshold_value TEXT;
                BEGIN
                    IF budget_percentage >= 100 THEN
                        notification_type := 'error';
                        notification_title := 'Budget Exceeded!';
                        notification_message := 'You have exceeded your monthly budget of ৳' || budget_record.budget_amount || ' in "' || budget_record.book_name || '". Current spending: ৳' || total_expenses;
                        threshold_value := '100';
                    ELSE
                        notification_type := 'warning';
                        notification_title := 'Budget Alert';
                        notification_message := 'You have used ' || ROUND(budget_percentage, 1) || '% of your ৳' || budget_record.budget_amount || ' budget in "' || budget_record.book_name || '"';
                        threshold_value := '80';
                    END IF;

                    INSERT INTO public.notifications (
                        user_id,
                        title,
                        message,
                        type,
                        metadata
                    ) VALUES (
                        budget_record.user_id,
                        notification_title,
                        notification_message,
                        notification_type,
                        jsonb_build_object(
                            'action', 'budget_alert',
                            'book_id', budget_record.book_id,
                            'month', current_month,
                            'budget_amount', budget_record.budget_amount,
                            'spent_amount', total_expenses,
                            'percentage', budget_percentage,
                            'threshold', threshold_value
                        )
                    );

                    notifications_created := notifications_created + 1;
                END;
            END IF;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'notifications_created', notifications_created,
        'checked_month', current_month
    );
END;
$$;