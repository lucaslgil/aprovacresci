-- Script para verificar as políticas RLS (Row Level Security) da tabela companies
SELECT 
    n.nspname AS schema_name,
    c.relname AS table_name,
    r.rolname AS table_owner,
    c.relrowsecurity AS has_row_security,
    c.relforcerowsecurity AS force_row_security
FROM 
    pg_class c
    JOIN pg_roles r ON r.oid = c.relowner
    LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE 
    c.relname = 'companies';

-- Verificar políticas RLS específicas para a tabela companies
SELECT 
    n.nspname AS schema_name,
    c.relname AS table_name,
    pol.polname AS policy_name,
    CASE 
        WHEN pol.polpermissive THEN 'PERMISSIVE'
        ELSE 'RESTRICTIVE'
    END AS policy_type,
    CASE 
        WHEN pol.polroles = '{public}'::name[] THEN 'PUBLIC'
        ELSE array_to_string(ARRAY(SELECT rolname FROM pg_roles WHERE oid = ANY(pol.polroles)), ', ')
    END AS roles,
    CASE pol.polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END AS command,
    pg_get_expr(pol.polqual, pol.polrelid) AS using_expression,
    pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check_expression
FROM 
    pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE 
    c.relname = 'companies';

-- Verificar permissões de usuário atual
SELECT 
    usename,
    usesuper,
    usecreatedb,
    userepl,
    usebypassrls
FROM 
    pg_user 
WHERE 
    usename = current_user;
