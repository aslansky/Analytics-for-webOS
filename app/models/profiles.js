Analytics.Model.Profiles = Analytics.Util.Singleton.create({
    initialize : function (args)
    {
        this.settings = Analytics.Util.Settings.getInstance();
        this.accounts = Analytics.Model.Accounts.getInstance();
        this.cachedData = {};
        
        this.columns = [
            new Analytics.Util.Database.Column({'name': 'id', 'type': 'INTEGER', 'constraints': ['PRIMARY KEY','AUTOINCREMENT']}),
            new Analytics.Util.Database.Column({'name': 'accountId', 'type': 'INTEGER'}),
            new Analytics.Util.Database.Column({'name': 'profileId'}),
            new Analytics.Util.Database.Column({'name': 'title'}),
            new Analytics.Util.Database.Column({'name': 'active', 'type':'INTEGER', 'constraints': ['DEFAULT','1']}),
            new Analytics.Util.Database.Column({'name': 'sort', 'type':'INTEGER', 'constraints': ['DEFAULT','0']}),
            new Analytics.Util.Database.Column({'name': 'lastUpdate'})
        ];
        
        this.dbTable = new Analytics.Util.Database.Table({
            'name': 'profiles',
            'columns': this.columns
        });
        
        this.db = new Analytics.Util.Database.Base({
            'name': 'analytics',
            'versions': '0.9.2'
        });
        
        if (!this.settings.get("global") || !this.settings.get("global").profilesDbCreated || !this.settings.get("global").profileDbVersion)
        {
            this.db.dropTable({
                table: this.dbTable,
                onSuccess : this.createTable.bind(this)
            });
        }
    },
    
    createTable: function ()
    {
        this.db.addTable({table : this.dbTable});
        this.settings.set("global", {profilesDbCreated : true, profileDbVersion : 2});
        console.log("================> profiles db created");
    },
    
    cleanup : function ()
    {
        this.columns = null;
        this.dbTable = null;
        this.db = null;
        
        this.settings = null;
        this.accounts = null;
        this.cachedData = null;
    },
    
    getAll : function (args)
    {
        console.log('profiles getall');
        var limiters = [];
        if (args.filter) {
            args.filter.each(function (item) {
                limiters.push(item);
            });
        }
        this.db.getData({
            table : this.dbTable,
            limiters: limiters,
            order: args.order,
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
        if (args.profileId)
        {
            this.db.getData({
                table : this.dbTable,
                limiters : [{
                    'column' : 'profileId',
                    'operand' : '=',
                    'value' : args.profileId
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
        console.log(Object.toJSON(response.rows));
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
    
    modify : function (args) {
        if (args.id)
        {
            this.db.getData({
                table : this.dbTable,
                limiters : [
                    {'column' : 'id', 'operand' : '=', 'value' : args.id}
                ],
                onSuccess : this.onModifyCheck.bind(this, args)
            });
        }
        else if (args.profileId) {
            this.db.getData({
                table : this.dbTable,
                limiters : [
                    {'column' : 'profileId', 'operand' : '=', 'value' : args.profileId}
                ],
                onSuccess : this.onModifyCheck.bind(this, args)
            });
        }
        else
        {
            if (args.onError)
            {
                args.onError({
                    msg : "Data missing",
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
            data.accountId = (args.accountId && args.accountId != response.rows.item(0).accountId) ? args.accountId : response.rows.item(0).accountId;
            data.profileId = (args.profileId && args.profileId != response.rows.item(0).profileId) ? args.profileId : response.rows.item(0).profileId;
            data.title = (args.title && args.title != response.rows.item(0).title) ? args.title : response.rows.item(0).title;
            data.sort = (args.sort >= 0 && args.sort != response.rows.item(0).sort) ? args.sort : response.rows.item(0).sort;
            data.active = ((args.active == 0 || args.active == 1) && args.active != response.rows.item(0).active) ? args.active : response.rows.item(0).active;
        }
        else {
            if (args.accountId) data.accountId = args.accountId;
            if (args.profileId) data.profileId = args.profileId;
            if (args.title) data.title = args.title;
            if (args.sort != undefined) data.sort = args.sort;
            if (args.active != undefined) data.active = args.active;
        }
        data.lastUpdate = new Date().toISOString();
        
        this.db.setData({
            table : this.dbTable,
            data : data,
            onSuccess : this.onModify.bind(this, args),
            onError : this.onModifyError.bind(this, args)
        });
    },
    
    onModify : function (args)
    {
        if (args.onSuccess)
        {
            args.onSuccess(args);
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
                onSuccess : this.onDel.bind(this, args),
                onError : this.onDelError.bind(this, args)
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
    },
    
    onDelError : function (args, response)
    {
    },
    
    getDetailsById : function (args)
    {
        if (args.id)
        {
            this.db.getData({
                table : this.dbTable,
                limiters : [
                    {'column' : 'id', 'operand' : '=', 'value' : args.id}
                ],
                onSuccess : this.onDetailsById.bind(this, args)
            });
        }
        else
        {
            if (args.onError)
            {
                args.onError({
                    msg : "Data missing",
                    code : "400"
                });
            }
        }
    },
    
    onDetailsById : function (args, response)
    {
        this.accounts.getById({
            id: response.rows.item(0).accountId,
            onSuccess: this.onAccountData.bind(this, args, response.rows.item(0))
        });
    },
    
    onAccountData : function (args, profile, response)
    {
        if (args.onSuccess)
        {
            profile.oauth_token = response[0].oauth_token;
            profile.oauth_secret = response[0].oauth_secret;
            args.onSuccess(profile);
        }
    }
});
