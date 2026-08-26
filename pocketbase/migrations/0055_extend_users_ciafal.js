migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // A.1 Extender coleção users com novos campos:
    // role, employee_id, team_id, manager_id, seller_code, ramal, telefone_corporativo, active
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          required: false,
          maxSelect: 1,
          values: [
            'vendedor',
            'supervisor',
            'gerente_comercial',
            'diretoria',
            'administrativo',
            'ti',
            'administrador',
            'auditor',
          ],
        }),
      )
    }

    if (!users.fields.getByName('employee_id')) {
      users.fields.add(new TextField({ name: 'employee_id', required: false, max: 100 }))
    }

    if (!users.fields.getByName('team_id')) {
      users.fields.add(new TextField({ name: 'team_id', required: false, max: 100 }))
    }

    if (!users.fields.getByName('manager_id')) {
      users.fields.add(
        new RelationField({
          name: 'manager_id',
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        }),
      )
    }

    if (!users.fields.getByName('seller_code')) {
      users.fields.add(new TextField({ name: 'seller_code', required: false, max: 100 }))
    }

    if (!users.fields.getByName('ramal')) {
      users.fields.add(new TextField({ name: 'ramal', required: false, max: 50 }))
    }

    if (!users.fields.getByName('telefone_corporativo')) {
      users.fields.add(new TextField({ name: 'telefone_corporativo', required: false, max: 50 }))
    }

    if (!users.fields.getByName('active')) {
      users.fields.add(new BoolField({ name: 'active', required: false }))
    }

    app.save(users)
  },
  (app) => {
    try {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      const fieldsToRemove = [
        'role',
        'employee_id',
        'team_id',
        'manager_id',
        'seller_code',
        'ramal',
        'telefone_corporativo',
        'active',
      ]
      fieldsToRemove.forEach((f) => {
        if (users.fields.getByName(f)) {
          users.fields.removeByName(f)
        }
      })
      app.save(users)
    } catch (_) {}
  },
)
