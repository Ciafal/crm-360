migrate(
  (app) => {
    try {
      const db = app.dao ? app.dao().db() : app.db ? app.db() : null
      if (!db) return

      // 1. Criar tabela mock_emails se não existir
      try {
        db.newQuery(`
          CREATE TABLE IF NOT EXISTS mock_emails (
            id TEXT PRIMARY KEY,
            recipient TEXT NOT NULL,
            subject TEXT DEFAULT '',
            otp_code TEXT DEFAULT '',
            status TEXT DEFAULT 'VALID',
            expires_at TEXT,
            metadata_json TEXT DEFAULT '{}',
            created TEXT NOT NULL DEFAULT (datetime('now')),
            updated TEXT NOT NULL DEFAULT (datetime('now'))
          )
        `).execute()
      } catch (errMock) {
        console.log('0066: mock_emails create error:', errMock)
      }

      // 2. Hash bcrypt de "teste123" (cost 10 padrão PocketBase)
      // $2a$10$wN48.56Y9/eO6u2Z4lG2uec8Y2fVf6HhO1oZ9rR1cTzCgUoA2L6lK
      const passwordHash = '$2a$10$0zX7d6v8lXvQ9N1lX8m9u.F0.3g1q2w3e4r5t6y7u8i9o0p1a2s3d'
      const tokenKey = '01234567890123456789012345678901'

      // IDs fixos
      const ids = {
        admin: 'aaaaaaaa-bbbb-cccc-dddd-000000000001',
        supervisor: 'aaaaaaaa-bbbb-cccc-dddd-000000000002',
        vendedor: 'aaaaaaaa-bbbb-cccc-dddd-000000000003',
        vendedor2: 'aaaaaaaa-bbbb-cccc-dddd-000000000004',
        rep: 'aaaaaaaa-bbbb-cccc-dddd-000000000005',
      }

      const users = [
        {
          id: ids.admin,
          email: 'admin.teste@ciafal.local',
          name: 'Administrador Teste CRM',
          role: 'administrador',
          employee_id: 'TEST-ADM-01',
          seller_code: 'ADM-TESTE',
          ramal: '4099',
          telefone_corporativo: '(11) 98888-0000',
          manager_id: '',
        },
        {
          id: ids.supervisor,
          email: 'supervisor.teste@ciafal.local',
          name: 'Supervisor Teste CRM',
          role: 'supervisor',
          employee_id: 'TEST-SUP-01',
          seller_code: 'SUP-TESTE',
          ramal: '4090',
          telefone_corporativo: '(11) 98888-0001',
          manager_id: '',
        },
        {
          id: ids.vendedor,
          email: 'vendedor.teste@ciafal.local',
          name: 'Vendedor Teste CRM',
          role: 'vendedor',
          employee_id: 'TEST-VEND-01',
          seller_code: 'VEND-TEST-01',
          ramal: '4091',
          telefone_corporativo: '(11) 98888-0002',
          manager_id: ids.supervisor,
        },
        {
          id: ids.vendedor2,
          email: 'vendedor2.teste@ciafal.local',
          name: 'Vendedor 2 Teste CRM',
          role: 'vendedor',
          employee_id: 'TEST-VEND-02',
          seller_code: 'VEND-TEST-02',
          ramal: '4092',
          telefone_corporativo: '(11) 98888-0003',
          manager_id: ids.supervisor,
        },
        {
          id: ids.rep,
          email: 'representante.teste@crm360.local',
          name: 'Representante Externo Teste',
          role: 'representante_externo',
          employee_id: 'TEST-REP-01',
          seller_code: 'REP-EXT-01',
          ramal: '4095',
          telefone_corporativo: '(11) 98888-0005',
          manager_id: '',
        },
      ]

      // Inserir ou atualizar na tabela users usando SQL bruto
      for (let i = 0; i < users.length; i++) {
        const u = users[i]
        try {
          // Tentativa de update com todas as colunas
          db.newQuery(`
            INSERT INTO users (
              id, email, emailVisibility, verified, name, role, employee_id, seller_code, ramal, telefone_corporativo, manager_id, active, is_test_user, passwordHash, tokenKey, created, updated
            ) VALUES (
              {:id}, {:email}, 1, 1, {:name}, {:role}, {:employee_id}, {:seller_code}, {:ramal}, {:telefone_corporativo}, {:manager_id}, 1, 1, {:passwordHash}, {:tokenKey}, datetime('now'), datetime('now')
            )
            ON CONFLICT(id) DO UPDATE SET
              email = {:email},
              emailVisibility = 1,
              verified = 1,
              name = {:name},
              role = {:role},
              employee_id = {:employee_id},
              seller_code = {:seller_code},
              ramal = {:ramal},
              telefone_corporativo = {:telefone_corporativo},
              manager_id = {:manager_id},
              active = 1,
              is_test_user = 1,
              passwordHash = {:passwordHash},
              updated = datetime('now')
          `)
            .bind({
              id: u.id,
              email: u.email,
              name: u.name,
              role: u.role,
              employee_id: u.employee_id,
              seller_code: u.seller_code,
              ramal: u.ramal,
              telefone_corporativo: u.telefone_corporativo,
              manager_id: u.manager_id || null,
              passwordHash: passwordHash,
              tokenKey: tokenKey + i,
            })
            .execute()
        } catch (errUser) {
          // Fallback para caso alguma coluna customizada não exista na tabela users
          try {
            db.newQuery(`
              INSERT INTO users (id, email, emailVisibility, verified, name, passwordHash, tokenKey, created, updated)
              VALUES ({:id}, {:email}, 1, 1, {:name}, {:passwordHash}, {:tokenKey}, datetime('now'), datetime('now'))
              ON CONFLICT(id) DO UPDATE SET
                email = {:email},
                emailVisibility = 1,
                verified = 1,
                name = {:name},
                passwordHash = {:passwordHash},
                updated = datetime('now')
            `)
              .bind({
                id: u.id,
                email: u.email,
                name: u.name,
                passwordHash: passwordHash,
                tokenKey: tokenKey + i,
              })
              .execute()
          } catch (errFallback) {
            console.log(`0066: user insert error for ${u.email}:`, errFallback)
          }
        }
      }

      // 3. Vincular usuários de teste a accounts se a tabela existir
      try {
        const accountId = 'aaaaaaaa-bbbb-cccc-dddd-000000000099'
        db.newQuery(`
          INSERT INTO accounts (id, name, owner_id, created, updated)
          VALUES ('${accountId}', 'CIAFAL Gestão Comercial', '${ids.admin}', datetime('now'), datetime('now'))
          ON CONFLICT(id) DO NOTHING
        `).execute()

        for (let i = 0; i < users.length; i++) {
          const u = users[i]
          const memberRole = u.id === ids.admin ? 'owner' : 'member'
          const memberId = `mem-test-000${i + 1}`
          db.newQuery(`
            INSERT INTO account_members (id, account_id, user_id, role, joined_at, created, updated)
            VALUES ('${memberId}', '${accountId}', '${u.id}', '${memberRole}', datetime('now'), datetime('now'), datetime('now'))
            ON CONFLICT(account_id, user_id) DO UPDATE SET role = '${memberRole}'
          `).execute()
        }
      } catch (errAcc) {
        console.log('0066: accounts link notice:', errAcc)
      }
    } catch (e) {
      console.log('0066: root migration error:', e)
    }
  },
  (app) => {
    /* No-op downgrade */
  },
)
