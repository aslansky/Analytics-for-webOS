Analytics.Util.Settings = Analytics.Util.Singleton.create(Class.create(), {
    
    initialize : function (args)
    {
        Object.extend(this, args);
        this._cookie = new Mojo.Model.Cookie("AnalyticsPrefs");
    },
    
    get : function (name)
    {
        try {
            var cookie = this._cookie.get();
            return cookie[name];
        }
        catch (e)
        {
            return undefined;
        }
    },
    
    set : function (name, obj)
    {
        var settings = this._cookie.get();
        if (settings)
        {
            if (!settings[name])
            {
                settings[name] = {};
            }
            Object.extend(settings[name], obj);
            this._cookie.put(settings);
        }
        else
        {
            var set = {};
            set[name] = obj;
            this._cookie.put(set);
        }
    },
    
    clear : function (name)
    {
        var settings = this._cookie.get();
        if (settings && settings[name]) {
            settings[name] = {};
            this._cookie.put(settings);
        }
    },
    
    cookie : function ()
    {
        return this._cookie;
    }
    
});