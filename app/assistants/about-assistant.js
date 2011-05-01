Analytics.Scene.About = Class.create(Analytics.Util.Base, {
    
    initialize : function ($super, args)
    {
        $super(args);
        
        this.handleWebsite = this.onWebsite.bind(this);
        this.handleSupport = this.onSupport.bind(this);
        this.handleEmail = this.onEmail.bind(this);
    },
    
    setup : function ($super)
    {
        $super();
    },
    
    aboutToActivate : function ($super, callback)
    {
        $super(callback);
    },
    
    activate : function ($super)
    {
        var renderedInfo = Mojo.View.render({object: {
            about: $L('About'),
            title: $L('Analytics'),
            from: Mojo.Controller.appInfo.version + ' ' + $L('by Alexander Slansky'),
            support: $L('Support'),
            appsite: $L('Application Web Site'),
            website: $L('Support Web Site'),
            mail: $L('Send Email'),
            copy: $('&copy; 2010 Alexander Slansky')
        }, template: 'about/content'});
        this.controller.get('about-scene').update(renderedInfo);
        Mojo.Event.listen(this.controller.get('website'), Mojo.Event.tap, this.handleWebsite);
        Mojo.Event.listen(this.controller.get('support'), Mojo.Event.tap, this.handleSupport);
        Mojo.Event.listen(this.controller.get('email'), Mojo.Event.tap, this.handleEmail);
        $super();
    },
    
    deactivate : function ()
    {
        
    },
    
    cleanup : function ($super)
    {
        this.name = null;
        Mojo.Event.stopListening(this.controller.get('website'), Mojo.Event.tap, this.handleWebsite);
        Mojo.Event.stopListening(this.controller.get('support'), Mojo.Event.tap, this.handleSupport);
        Mojo.Event.stopListening(this.controller.get('email'), Mojo.Event.tap, this.handleEmail);
        this.handleWebsite = null;
        this.handleSupport = null;
        this.handleEmail = null;
        $super();
    },
    
    onWebsite : function ()
    {
        this.controller.serviceRequest("palm://com.palm.applicationManager", {
            method: "open",
            parameters:  {
                id: 'com.palm.app.browser',
                params: {
                    target: "http://slansky.net/analytics"
                }
            }
        });
    },
    
    onSupport : function ()
    {
        this.controller.serviceRequest("palm://com.palm.applicationManager", {
            method: "open",
            parameters:  {
                id: 'com.palm.app.browser',
                params: {
                    target: "http://support.slansky.net"
                }
            }
        });
    },
    
    onEmail : function ()
    {
        this.controller.serviceRequest('palm://com.palm.applicationManager', {
            method:'open',
            parameters:{ target: 'mailto:support@slansky.net?subject=Support%20for%20AnalyticsDashboard'}
        });
    }
    
});