Analytics.Util.DataStore = Analytics.Util.Singleton.create(Class.create(), {
    
    initialize : function (args)
    {
        this.data = {};
    },
    
    cleanup : function ()
    {
        this.invalidate();
    },
    
    set : function (id, name, obj)
    {
        if (!this.data) {
            this.data = {};
        }
        if (!this.data[id]) {
            this.data[id] = {};
        }
        this.data[id][name] = obj;
    },
    
    get : function (id, name)
    {
        if (this.data && this.data[id] && this.data[id][name]) {
            return this.data[id][name];
        }
        return null;
    },
    
    isValid : function (id, name, period, startDate, endDate)
    {
        if (!this.data) {
            return false;
        }
        if (!this.data[id] || !this.data[id]['auth'] || !this.data[id][name] || this.data[id]['period'] != period) {
            this.invalidate(id, name);
            return false;
        }
        if (this.period == 'custom' && (this.data[id]['startDate'] != startDate || this.data[id]['endDate'] != endDate)) {
            this.invalidate(id, name);
            return false;
        }
        return true;
    },
    
    invalidate : function (id, name)
    {
        if (id && name) {
            if (this.data && this.data[id] && this.data[id][name]) {
                this.data[id][name] = null;
            }
        }
        else if (id) {
            if (this.data && this.data[id]) {
                this.data[id] = null;
            }
        }
        else {
            this.data = null;
        }
    }
    
});