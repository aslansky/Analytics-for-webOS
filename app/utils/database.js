/*
 * Example:
 *
 *  Create column instances
 *      var userId = Analytics.Util.Database.Column({
 *          'name': 'userId',
 *          'type': 'INTEGER',
 *          'constraints': ['PRIMARY KEY']
 *      });
 *      var password = Analytics.Util.Database.Column({
 *          'name': 'userId'
 *      });
 *
 *  Create table instance
 *      var users = Analytics.Util.Database.Table({
 *          'name': 'users',
 *          'columns': [userId, password]
 *      });
 *
 * Get db instance
 *      var appDb = Analytics.Util.Database.Base({
 *          'name': 'myAppDb',
 *          'versions': '0.0.1',
 *          'displayName': 'My Awesome Application Database'
 *      });
 */
Analytics.Util.Database.Base = Class.create(Class.create(), {
    initialize : function (definition)
    {
        this.definition = definition || { // some default db naming if the definition is empty
            'name': Mojo.appInfo.title.split(' ').join('-').toUpperCase() + '-' + Mojo.appInfo.version,
            'version': Mojo.appInfo.version,
            'displayName': Mojo.appInfo.title
        };
        this.definition.schema = {};
        if (this.definition.displayName)
        {
            this.definition.connection = openDatabase(this.definition.name, this.definition.version, this.definition.displayName);
        }
        else
        {
            this.definition.connection = openDatabase(this.definition.name, this.definition.version);
        }
    },
    
    updateSchema : function (table)
    {
        this.definition.schema[table.getName()] = {'name': table.getName(), 'status': 'completed', 'table': table};
    },

    getName : function()
    {
        return this.definition.name;
    },

    getVersion : function()
    {
        return this.definition.version;
    },

    getDisplayName : function()
    {
        return this.definition.displayName;
    },

    getConnection : function()
    {
        return this.definition.connection;
    },
    
    query : function (args)
    {
        this.definition.connection.transaction(function(transaction)
        {
            transaction.executeSql(args.query, [],
                function(transaction, results)
                {
                    try
                    {
                        if (args.onSuccess) {
                            args.onSuccess(results, args);
                        }
                    }
                    catch(e)
                    {
                        console.log(e);
                    }
                }.bind(this),
                function(transaction, error)
                {
                    if (args.onError) {
                        args.onError(error);
                    }
                    console.log('UNABLE TO QUERY: ' + error.message);
                }.bind(this)
            );
        }.bind(this));
    },

    addTable : function(args)
    {
        this.definition.connection.transaction(function(transaction)
        {
            this.definition.schema[args.table.getName()] = {'name': args.table.getName(), 'status': 'pending', 'table': {}};
            transaction.executeSql(args.table.getCreateSql(), [],
                function(transaction, results)
                {
                    try
                    {
                        this.updateSchema(args.table);
                        if (args.onSuccess) {
                            args.onSuccess(results, this.definition, args);
                        }
                    }
                    catch(e)
                    {
                        console.log(e);
                    }
                }.bind(this),
                function(transaction, error)
                {
                    if (args.onError) {
                        args.onError(error);
                    }
                    console.log('UNABLE TO ADD TABLE: ' + error.message);
                }.bind(this)
            );
        }.bind(this));
    },
    
    dropTable : function(args)
    {
        this.definition.connection.transaction(function(transaction)
        {
            this.definition.schema[args.table.getName()] = {'name': args.table.getName(), 'status': 'pending', 'table': {}};
            transaction.executeSql(args.table.getDropSql(), [],
                function(transaction, results)
                {
                    try
                    {
                        this.updateSchema(args.table);
                        if (args.onSuccess) {
                            args.onSuccess(results, this.definition, args);
                        }
                    }
                    catch(e)
                    {
                        console.log(e);
                    }
                }.bind(this),
                function(transaction, error)
                {
                    if (args.onError) {
                        args.onError(error);
                    }
                    console.log('UNABLE TO ADD TABLE: ' + error.message);
                }.bind(this)
            );
        }.bind(this));
    },
    
    setData : function (args)
    {
        this.definition.connection.transaction(function(transaction)
        {
            if (!args.table || !args.data) {
                console.log("no table or data given.");
                return;
            }
            this.definition.schema[args.table.getName()] = {'name': args.table.getName(), 'status': 'pending', 'table': {}};
            var sql = args.table.getInsertSql(args.data);
            transaction.executeSql(sql.sql, sql.values,
                function(transaction, results)
                {
                    try
                    {
                        this.updateSchema(args.table);
                        if(args.onSuccess)
                        {
                            args.onSuccess(results, this.definition, args);
                        }
                    }
                    catch(e)
                    {
                        console.log(e);
                    }
                }.bind(this),
                function(transaction, error)
                {
                    if (args.onError) {
                        args.onError(error, args);
                    }
                    console.log('UNABLE TO ADD DATA: ' + error.message);
                }.bind(this)
            );
        }.bind(this));
    },
    
    getData : function (args)
    {
        if (!args.table) {
            console.log("no table given.");
            return;
        }
        this.definition.connection.transaction(function(transaction)
        {
            this.definition.schema[args.table.getName()] = {'name': args.table.getName(), 'status': 'pending', 'table': {}};
            transaction.executeSql(args.table.getSelectSql(args.limiters, args.order), [],
                function(transaction, results)
                {
                    try
                    {
                        this.updateSchema(args.table);
                        if(args.onSuccess)
                        {
                            args.onSuccess(results, this.definition, args);
                        }
                    }
                    catch(e)
                    {
                        console.log(e);
                    }
                }.bind(this),
                function(transaction, error)
                {
                    if (args.onError) {
                        args.onError(error, args);
                    }
                    console.log('UNABLE TO GET DATA: ' + error.message);
                }.bind(this)
            );
        }.bind(this));
    },
    
    removeData : function (args)
    {
        if (!args.table) {
            console.log("no table given.");
            return;
        }
        this.definition.connection.transaction(function(transaction)
        {
            this.definition.schema[args.table.getName()] = {'name': args.table.getName(), 'status': 'pending', 'table': {}};
            transaction.executeSql(args.table.getDeleteSql(args.limiters), [],
                function(transaction, results)
                {
                    try
                    {
                        this.updateSchema(args.table);
                        if(args.onSuccess)
                        {
                            args.onSuccess(results, this.definition, args);
                        }
                    }
                    catch(e)
                    {
                        console.log(e);
                    }
                }.bind(this),
                function(transaction, error)
                {
                    if (args.onError) {
                        args.onError(error, args);
                    }
                    console.log('UNABLE TO DELETE DATA: ' + error.message);
                }.bind(this)
            );
        }.bind(this));
    },

    getSchema : function()
    {
        return this.definition.schema;
    }
});

Analytics.Util.Database.Column = Class.create(Class.create(), {
    initialize : function (definition)
    {
        this.definition = definition || {};
        this.sql;
    },
    
    getName : function()
    {
        return this.definition.name;
    },

    getType : function()
    {
        return this.definition.type;
    },

    getConstraints : function()
    {
        return this.definition.constraints;
    },

    getBuildSql : function ()
    {
        if (!this.sql) {
            var type = (this.definition.type) ? ' ' + this.definition.type : '';
            this.sql = this.definition.name + type;
            if (this.definition.constraints)
            {
                this.sql += ' ' + this.definition.constraints.join(' ');
            }
        }
        return this.sql;
    }
});

Analytics.Util.Database.Table = Class.create(Class.create(), {
    initialize : function (definition)
    {
        this.definition = definition || {};
        
        if (!this.definition.columns)
        {
            try
            {
                throw ('No columns defined for table: ' + this.definition.name);
            }
            catch(e)
            {
                console.log(e);
            }
        }
    },

    getName : function()
    {
        return this.definition.name;
    },

    getColumns : function()
    {
        return this.definition.columns;
    },

    getCreateSql : function()
    {
        if (!this.definition.columns) {
            try
            {
                throw ('No columns defined for table: ' + this.definition.name);
            }
            catch(e)
            {
                console.log(e);
            }
        }
        var columnArray = [];
        sql = "CREATE TABLE IF NOT EXISTS '" + this.definition.name + "' (";
        for (i = 0; i < this.definition.columns.length; i += 1)
        {
            columnArray.push(this.definition.columns[i].getBuildSql());
        }
        sql += columnArray.join(',') + ")";
        return sql;
    },
    
    getInsertSql : function(record)
    { // record is in JSON format
        try
        {
            if (!this.definition.columns)
            {
                throw('no columns defined for table: ' + this.definition.name);
            }
            if (!record)
            {
                throw('no record to insert into table: ' + this.definition.name);
            }
        }
        catch(e)
        {
            console.log(e);
        }
        var values = [];
        var inserts = [];
        var columns = [];
        sql = "INSERT OR REPLACE INTO '" + this.definition.name + "'";
        for (i in record) {
            inserts.push('?');
            values.push(record[i]);
            columns.push(i.toString());
        }
        sql += " (" + columns.join(', ') + ")";
        sql +=  " VALUES (" + inserts.join(', ') + ")";
        return {sql : sql, values : values};
    },
    
    getSelectSql : function(limiters, order)
    { // limiter is array of WHERE clauses in JSON format
        sql = "SELECT * FROM '" + this.definition.name + "'";
        if (!limiters)
        {
            limiters = [];
        }
        if (limiters.length > 0) {
            sql += " WHERE ";        
            for (i = 0; i < limiters.length; i += 1)
            {
                sql += limiters[i].column + limiters[i].operand + "'" + limiters[i].value + "'" + (limiters[i].connector ? " " + limiters[i].connector + " " : "");
            }
        }
        if (order) {
            sql += " ORDER BY " + order;
        }
        return sql;
    },
    
    getDeleteSql : function (limiters)
    {
        sql = "DELETE FROM '" + this.definition.name + "'";
        if (!limiters)
        {
            limiters = [];
        }
        if (limiters.length > 0) {
            sql += " WHERE ";        
            for (i = 0; i < limiters.length; i += 1)
            {
                sql += limiters[i].column + limiters[i].operand + "'" + limiters[i].value + "'" + (limiters[i].connector ? " " + limiters[i].connector + " " : "");
            }
        }
        return sql;
    },
    
    getDropSql : function (limiters)
    {
        sql = "DROP TABLE IF EXISTS '" + this.definition.name + "'";
        return sql;
    }
});
