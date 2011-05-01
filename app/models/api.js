Analytics.Model.Api = Analytics.Util.Singleton.create({
    
    initialize : function (args)
    {
        this.name = "Analytics.Model.Api";
        //this.authService = 'https://www.google.com/accounts/ClientLogin';
        this.accountService = 'https://www.google.com/analytics/feeds/accounts/default?alt=json';
        this.dataService = 'https://www.google.com/analytics/feeds/data?alt=json';
        this.accountType = 'GOOGLE';
        this.source = 'slansky-analytice-0.9.2';
        this.service = 'analytics';
        this.accounts = Analytics.Model.Accounts.getInstance();
        this.profiles = Analytics.Model.Profiles.getInstance();
        this.authToken = {};
        
        // outh
        this.requestTokenUrl = 'https://www.google.com/accounts/OAuthGetRequestToken';
        this.requestTokenMethod = 'GET'; // Optional - 'GET' by default if not specified
        this.authorizeUrl = 'https://www.google.com/accounts/OAuthAuthorizeToken';
        this.accessTokenUrl = 'https://www.google.com/accounts/OAuthGetAccessToken';
        this.accessTokenMethod = 'GET'; // Optional - 'GET' by default if not specified
        this.authScope = 'https://www.google.com/analytics/feeds/';
        this.consumer_key = 'slansky.net';
        this.consumer_key_secret = 'nKYZro0belhEQHDr9P90Rtdq';
    },
    
    cleanup : function ()
    {
        this.name = null;
        //this.authService = null;
        this.accountService = null;
        this.dataService = null;
        this.captchaService = null;
        this.accountType = null;
        this.source = null;
        this.service = null;
        this.accounts = null;
        this.profiles = null;
        this.auth = null;
    },
    
    signHeader: function (url, token, secret, params)
    {
        if (!params) params = '';
        var timestamp = OAuth.timestamp();
        var nonce = OAuth.nonce(11);
        var accessor = {consumerSecret: this.consumer_key_secret, tokenSecret : secret};
        var message = {method: 'GET', action: url, parameters: OAuth.decodeForm(params)};
        message.parameters.push(['oauth_consumer_key', this.consumer_key]);
        message.parameters.push(['oauth_nonce', nonce]);
        message.parameters.push(['oauth_signature_method', 'HMAC-SHA1']);
        message.parameters.push(['oauth_timestamp', timestamp]);
        message.parameters.push(['oauth_token', token]);
        message.parameters.push(['oauth_version', '1.0']);
        message.parameters.sort();
        OAuth.SignatureMethod.sign(message, accessor);
        return OAuth.getOAuthorizationHeader("", message.parameters);
    },
    
    getAccountInfo : function (args)
    {
        if (args.id)
        {
            this.accounts.getById({
                id: args.id,
                onSuccess: this.onGetAccountInfo.bind(this, args)
            });
        }
        else {
            if (args.onError)
            {
                args.onError({
                    msg : "AccountID missing",
                    code : "400"
                });
            }
        }
    },
    
    onGetAccountInfo : function (args, result)
    {
        console.log('onGetAccountInfo');
        if (result.length == 1)
        {
            console.log('if');
            new Ajax.Request(this.accountService, {
                method: 'get',
                encoding: 'UTF-8',
                contentType: 'application/json',
                requestHeaders: {
                    'Authorization': this.signHeader(this.accountService, result[0].oauth_token, result[0].oauth_secret)
                },
                onComplete: this.onAccountInfoSuccess.bind(this, args),
                onFailure: this.onAccountInfoError.bind(this, args)
            });
        }
        else {
            if (args.onError)
            {
                args.onError({
                    msg : "Account not found",
                    code : "404"
                });
            }
        }
    },
    
    onAccountInfoSuccess : function (args, response)
    {
        console.log('onAccountInfoSuccess');
        var entries = new JPath(response.responseJSON.feed).query('//entry');
        this.accounts.modify({
            id: args.id,
            profiles: entries.length
        });
        entries.each(function (item) {
            var entry = new JPath(item);
            console.log(Object.toJSON(entry));
            this.profiles.modify({
                accountId: args.id,
                profileId: entry.query("dxp*property[name == 'ga:profileId']")[0].value,
                title: entry.query("/title")["$t"],
                tableId:  entry.query("/dxp*tableId")["$t"],
                //onError: this.onSaveError.bind(this, args),
                onSuccess: this.onAccountInfoSave.bind(this, args)
            });
        }, this);
    },
    
    onAccountInfoError : function (args, response)
    {
        console.log('onAccountInfoError');
        console.log(response.responseText);
        if (args.onError)
        {
            args.onError({
                msg : "Account not found",
                code : "404"
            });
        }
    },
    
    onAccountInfoSave : function (args)
    {
        if (args.onSuccess)
        {
            args.onSuccess(args);
        }
    },
    
    getData : function (args)
    {
        if (args.profileId && args.oauth_token && args.oauth_secret && args.metrics)
        {
            var dates = this.getPeriodDates(args.period, args.dateFrom, args.dateTo);
            var startDate = dates[0];
            var endDate = dates[1];
            var params = {
                'ids': 'ga:' + args.profileId,
                'start-date': startDate,
                'end-date': endDate
            };
            if (args.sort) params.sort = args.sort;
            if (args.metrics) params.metrics = args.metrics;
            if (args.dimensions) params.dimensions = args.dimensions;
            if (args.filters) params.filters = args.filters;
            var p = [];
            Object.keys(params).each(function (item) {
                p.push(item + "=" + params[item]);
            });
            console.log(p.join("&"));
            var request = new Ajax.Request(this.dataService, {
                method: 'get',
                encoding: 'UTF-8',
                contentType: 'application/json',
                requestHeaders: {
                    'Authorization': this.signHeader(this.dataService, args.oauth_token, args.oauth_secret, p.join("&"))
                },
                parameters: params,
                onSuccess: this.onDataSuccess.bind(this, args, startDate, endDate),
                onFailure: this.onDataError.bind(this, args)
            });
        }
        else {
            if (args.onError)
            {
                args.onError({
                    msg : "Arguments missing",
                    code : "400"
                });
            }
        }
    },
    
    onDataSuccess : function (args, startDate, endDate, response)
    {
        var entries = new JPath(response.responseJSON.feed).query('//entry');
        var result;
        if (entries.length == 1 && !args.dimensions) {
            result = {};
            entries.each(function (item) {
                var entry = new JPath(item);
                var metrics = entry.query("dxp*metric");
                metrics.each(function (metric) {
                    result[metric.name] = metric.value;
                });
            }, this);
        }
        else {
            result = [];
            entries.each(function (item, index) {
                result[index] = {};
                var entry = new JPath(item);
                var metrics = entry.query("dxp*metric");
                var dimensions = entry.query("dxp*dimension");
                metrics.each(function (metric) {
                    result[index][metric.name] = metric.value;
                });
                dimensions.each(function (dimension) {
                    result[index][dimension.name] = dimension.value;
                });
            }, this);
        }
        if (args.onSuccess)
        {
            args.onSuccess(result, startDate, endDate);
        }
    },
    
    onDataError : function (args, response)
    {
        console.log('onDataError');
        //console.log(Object.toJSON(response.responseText));
        if (args.onError)
        {
            args.onError({
                msg : "Error getting data",
                info: response.responseText,
                code : "404"
            });
        }
    },
    
    getPeriodDates : function (period, dateFrom, dateTo)
    {
        var startDate;
        var endDate;
        switch (period) {
            case 'custom':
                startDate = dateFrom;
                endDate = dateTo;
            break;
            case 'day':
                startDate = endDate = new Date().add(-1, 'days').dateFormat("YYYY-MM-DD");
            break;
            case 'week':
                startDate = new Date().add(-1, 'weeks').dateFormat("YYYY-MM-DD");
                endDate = new Date().add(-1, 'days').dateFormat("YYYY-MM-DD");
            break;
            case 'year':
                startDate = new Date().add(-1, 'days').add(-1, 'years').dateFormat("YYYY-MM-DD");
                endDate = new Date().add(-1, 'days').dateFormat("YYYY-MM-DD");
            break;
            default:
                startDate = new Date().add(-1, 'days').add(-1, 'months').dateFormat("YYYY-MM-DD");
                endDate = new Date().add(-1, 'days').dateFormat("YYYY-MM-DD");
            break;
        }
        return [startDate, endDate];
    }
    
});
//GET&https%3A%2F%2Fwww.google.com%2Fanalytics%2Ffeeds%2Fdata&alt%3Djson%26end-date%3D2010-09-04%26ids%3Dga%253A7812613%26metrics%3Dga%253Avisits%252Cga%253Abounces%252Cga%253Apageviews%26oauth_consumer_key%3Dslansky.net%26oauth_nonce%3D8584e47237bb41b3148aab4ee7c55c87%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D1283709187%26oauth_token%3D1%252FyQRzM4HGt9O2SYLZBA9xZVoej0tq1dTNLEzRMMCvKuo%26oauth_version%3D1.0%26start-date%3D2010-08-04
//GET&https%3A%2F%2Fwww.google.com%2Fanalytics%2Ffeeds%2Fdata&alt%3Djson%26end-date%3D2010-09-04%26ids%3Dga%253A30295480%26metrics%3Dga%253Avisits%252Cga%253Abounces%252Cga%253Apageviews%26oauth_consumer_key%3Dslansky.net%26oauth_nonce%3DHOV0Jnx6Kaq%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D1283709425%26oauth_token%3D1%252FiIG2hmJtFvXei5jSQ7ZN_m2eXiCMMNMiu4Faoa34tVI%26oauth_version%3D1.0%26start-date%3D2010-08-04