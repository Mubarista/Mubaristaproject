-- Restrict application_reviewer role to application management only
DELETE FROM permissions WHERE role_id = 'application_reviewer' AND module != 'applications';

-- Ensure application_reviewer has read and update on applications
INSERT INTO permissions (role_id, module, can_create, can_read, can_update, can_delete)
VALUES ('application_reviewer', 'applications', false, true, true, false)
ON CONFLICT (role_id, module) DO UPDATE SET
  can_create = false,
  can_read = true,
  can_update = true,
  can_delete = false;
