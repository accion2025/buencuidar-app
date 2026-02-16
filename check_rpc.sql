-- check_rpc.sql
SELECT 
    p.proname as function_name, 
    pg_get_function_result(p.oid) as result_type,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
WHERE p.proname IN ('approve_service_group', 'notify_on_application_status_change');
