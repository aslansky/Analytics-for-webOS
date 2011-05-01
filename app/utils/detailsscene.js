Analytics.Util.Details = Class.create(Analytics.Util.Period, {
    
    initialize : function($super, params) {
        $super(params);
        
        this.accounts = Analytics.Model.Accounts.getInstance();
        this.profiles = Analytics.Model.Profiles.getInstance();
        this.getHandler = this.handleGet.bind(this);
        
        this.item = params.item;
        
        this.period = params.period;
        this.startDate = params.startDate;
        this.endDate = params.endDate;
    },
    
    setup : function ($super)
    {
        this.categoryMenuModel = { label: $L('More'), 
            items: [
                {label:$L('Overview'), command: 'overview'},
                {label:$L('Content Overview'), command: 'content'},
                {label:$L('Browsers'), command: 'browsers'}, 
                {label:$L('Traffic Sources'), command: 'traffic'},
                {label:$L('Search Engines'), command: 'search'},
                {label:$L('Keywords'), command: 'keywords'},
                {label:$L('Campaigns'), command: 'campaign'},
                {label:$L('Events'), command: 'event'},
                {label:$L('Goals'), command: 'goal'}
            ]
        };
        $super();
        this.controller.setupWidget('load-spinner', {spinnerSize: 'large'}, {spinning: true});
        this.scrim = Mojo.View.createScrim(this.controller.document, {scrimClass: 'palm-scrim'});
        this.controller.get('load-scrim').appendChild(this.scrim).appendChild(this.controller.get('load-spinner'));
    },
    
    aboutToActivate : function ($super, callback)
    {
        $super();
    },
    
    activate : function ($super)
    {
        
        if (!this.store.get(this.item.id, 'oauth_token')) {
            this.getAuth();
        }
        else {
            this.getData();
        }
        
        if (!this.startDate || !this.endDate) {
            this.setTitle(this.store.get(this.item.id, 'startDate'), this.store.get(this.item.id, 'endDate'));
        }
        else {
            this.setTitle(this.startDate, this.endDate);
        }
        $super();
    },
    
    getAuth : function ()
    {
        this.accounts.getById({
            id: this.item.accountId,
            onSuccess: this.getHandler
        });
    },
    
    deactivate : function ($super)
    {
        $super();
    },
    
    cleanup : function ($super)
    {
        this.categoryMenuModel = null;
        this.item = null;
        this.period = null;
        this.startDate = null;
        this.endDate = null;
        this.getHandler = null;
        
        this.accounts = null;
        this.profiles = null;

        $super();
    },
    
    showSpinner : function ()
    {
        this.controller.get('load-spinner').mojo.start();
        this.scrim.show();
    },
    
    hideSpinner : function ()
    {
        this.controller.get('load-spinner').mojo.stop();
        this.scrim.hide();
    },
    
    secondsToTime : function (d)
    {
        d = Number(d);
        var h = Math.floor(d / 3600);
        var m = Math.floor(d % 3600 / 60);
        var s = Math.floor(d % 3600 % 60);
        return ((h > 0 ? h + ":" : "") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + ":" : "0:") + (s < 10 ? "0" : "") + s);
        /*
        var hours = Math.floor(secs / (60 * 60));

        var divisor_for_minutes = secs % (60 * 60);
        var minutes = Math.floor(divisor_for_minutes / 60);

        var divisor_for_seconds = divisor_for_minutes % 60;
        var seconds = Math.ceil(divisor_for_seconds);

        return hours.toFixed().pad(2, '0') + ':' + minutes.toFixed().pad(2, '0') + ':' + seconds.toFixed().pad(2, '0');
        */
    },
    
    max : function( array ){
        return Math.max.apply( Math, array );
    },
    
    handleGet : function (result)
    {
        this.store.set(this.item.id, 'oauth_token', result[0].oauth_token);
        this.store.set(this.item.id, 'oauth_secret', result[0].oauth_secret);
        this.getData();
    },
    
    handleCommand : function($super, event)
    {
        if(event.type == Mojo.Event.command)
        {
            switch(event.command) {
                case 'do-refresh':
                break;
                case 'dashboard':
                break;
                default:
                    this.showScene(event.command, {item : this.item, period: this.period, startDate: this.startDate, endDate: this.endDate, transition: true});
                    break;
            }
        }
        $super(event);
    }
});

String.prototype.pad = function(l, s){
    return (l -= this.length) > 0  ? (s = new Array(Math.ceil(l / s.length) + 1).join(s)).substr(0, s.length) + this + s.substr(0, l - s.length)  : this;
};

Array.prototype.sum = function() {
  return (!this.length) ? 0 : this.slice(1).sum() + ((typeof this[0] == 'number') ? this[0] : 0);
};