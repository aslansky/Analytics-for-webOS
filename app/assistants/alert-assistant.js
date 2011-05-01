Analytics.Scene.Alert = Class.create(Class.create(), {
    
    initialize: function ($super, args)
    {
        this.text = args.text;
        this.type = args.type;
        this.delay = args.delay;
        this.close = this.doClose.bind(this);
    },
    
    setup : function ()
    {
        
    },
    
    activate : function ()
    {
        this.controller.get("alert-text").className = '';
        this.controller.get("alert-text").addClassName(this.type).update(this.text);
        if (this.delay > 0) {
            this.timeout = setTimeout(this.close, this.delay);
        }
    },
    
    deactivate : function ()
    {
        clearTimeout(this.timeout);
    },
    
    doClose: function() {
    	this.controller.window.close();
    }
    
});