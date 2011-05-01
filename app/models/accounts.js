Analytics.Model.Accounts = Analytics.Util.Singleton.create({
    initialize : function (args)
    {
        this.settings = Analytics.Util.Settings.getInstance();
        
        this.columns = [
            new Analytics.Util.Database.Column({'name': 'id','type': 'INTEGER','constraints': ['PRIMARY KEY','AUTOINCREMENT']}),
            new Analytics.Util.Database.Column({'name': 'name'}),
            new Analytics.Util.Database.Column({'name': 'oauth_token'}),
            new Analytics.Util.Database.Column({'name': 'oauth_secret'}),
            new Analytics.Util.Database.Column({'name': 'profiles'})
        ];
        
        this.dbTable = new Analytics.Util.Database.Table({
            'name': 'accounts',
            'columns': this.columns
        });
        
        this.db = new Analytics.Util.Database.Base({
            'name': 'analytics',
            'versions': '0.9.2'
        });
        // new install
        if (!this.settings.get("global") || !this.settings.get("global").accountsDbCreated || !this.settings.get("global").accountsDbVersion)
        {
            this.db.dropTable({
                table: this.dbTable,
                onSuccess : this.createTable.bind(this)
            });
        }
        // todo: update on later versions
    },
    
    createTable : function ()
    {
        this.db.addTable({table : this.dbTable});
        this.settings.set("global", {accountsDbCreated : true, accountsDbVersion : 2});
        console.log("================> accounts table created");
    },
    
    cleanup : function ()
    {
        this.settings = null;
        this.columns = null;
        this.dbTable = null;
        this.db = null;
    },
    
    getAll : function (args)
    {
        console.log('accounts getall');
        this.db.getData({
            table : this.dbTable,
            onSuccess : this.onGetData.bind(this, args)
        });
    },
    
    getById : function (args)
    {
        if (args.id)
        {
            this.db.getData({
                table : this.dbTable,
                limiters : [{
                    'column' : 'id',
                    'operand' : '=',
                    'value' : args.id
                }],
                onSuccess : this.onGetData.bind(this, args)
            });
        }
        else
        {
            if (args.onError)
            {
                args.onError({
                    msg : "ID missing",
                    code : "400"
                });
            }
        }
    },
    
    onGetData : function (args, response)
    {
        var result = [];
        for (var i = 0; i < response.rows.length; ++i)
        {
            var row = response.rows.item(i);
            result.push(row);
        }
        if (args.onSuccess)
        {
            args.onSuccess(result);
        }
    },
    
    /*
     * MODIFY OR CREATE NEW ACCOUNT
     */
    modify : function (args) {
        if (args.id)
        {
            console.log('modify by id: ' + args.id);
            this.db.getData({
                table : this.dbTable,
                limiters : [
                    {'column' : 'id', 'operand' : '=', 'value' : args.id}
                ],
                onSuccess : this.onModifyCheck.bind(this, args)
            });
        }
        else if (args.name) {
            console.log('modify by name: ' + args.name);
            this.db.getData({
                table : this.dbTable,
                limiters : [
                    {'column' : 'name', 'operand' : '=', 'value' : args.name}
                ],
                onSuccess : this.onModifyCheck.bind(this, args)
            });
        }
        else
        {
            if (args.onError)
            {
                args.onError({
                    msg : "Data missing (name or id)",
                    code : "400"
                });
            }
        }
    },
    
    onModifyCheck : function (args, response)
    {
        var data = {};
        if (response.rows.length > 0)
        {
            data.id = response.rows.item(0).id;
            data.name = response.rows.item(0).name;
            data.oauth_token = response.rows.item(0).oauth_token;
            data.oauth_secret = response.rows.item(0).oauth_secret;
            data.profiles = response.rows.item(0).profiles;
        }
        if (args.name) {
            data.name = args.name;
        }
        if (args.oauth_token) {
            data.oauth_token = args.oauth_token;
        }
        if (args.oauth_secret) {
            data.oauth_secret = args.oauth_secret;
        }
        if (args.profiles) {
            data.profiles = args.profiles;
        }
        console.log(Object.toJSON(data));
        this.db.setData({
            table : this.dbTable,
            data : data,
            onSuccess : this.onModify.bind(this, args),
            onError : this.onModifyError.bind(this, args)
        });
    },
    
    onModify : function (args, response)
    {
        if (args.onSuccess)
        {
            args.onSuccess(response.insertId);
        }
    },
    
    onModifyError : function (args)
    {
        if (args.onError)
        {
            args.onError({
                msg : "Modify failed",
	            code : "404"
            });
        }
    },
    
    del : function (args)
    {
        if (args.limiters)
        {
            this.db.removeData({
                table : this.dbTable,
                limiters : args.limiters,
                onSuccess : this.onDel.bind(this, args)
            });
        }
        else
        {
            if (args.onError)
            {
                args.onError({
                    msg : "Limiters missing",
                    code : "400"
                });
            }
        }
    },
    
    onDel : function (args, response)
    {
        if (args.onSuccess)
        {
            args.onSuccess(response);
        }
    }
});