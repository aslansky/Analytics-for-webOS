Analytics.Util.Base = Class.create(Class.create(), {
    initialize : function(params)
    {
        this.params = params || {};
        this.params.applicationRoot = this.params.applicationRoot || "";
        this.appController = Mojo.Controller.getAppController();
    },

    setup : function () {
        this.sceneName = this.controller.sceneName;
        // app menu
        this.controller.setupWidget(
            Mojo.Menu.appMenu,
            {
                omitDefaultItems: true
            }, {
                visible: true,
                items: [
                    Mojo.Menu.editItem,
                    { label: $L("About"), command: "do-about"  },
                    { label: $L("Preferences & Accounts"), command: "do-prefs"  },
                    //Mojo.Menu.prefsItem,
                    Mojo.Menu.helpItem
                ]
            }
        );
    },

    aboutToActivate : function(callback)
    {
    },

    activate : function()
    {
    },
    
    activateWindow : function ()
    {
    },
    
    deactivateWindow : function ()
    {
    },
    
    deactivate : function ()
    {
        this.hideAlert();
    },

    cleanup : function()
    {
        this.params = null;
        this.sceneName = null;
        this.cmd = null;
        
        this.activateHandler = null;
        this.deactivateHandler = null;
        this.handleSuspend = null;
    },

    showScene : function(name, params)
    {
        if (this.sceneName != name || name == "list")
        {
            var pushParams = {};
            var sceneParams = params || {};
            if (typeof name === "object")
            {
                pushParams = name;
            }
            else if (typeof name === "string")
            {
                pushParams = {name: name};
            }
            else
            {
                throw "showScene has invalid params.";
            }
            if (params && params.transition)
            {
                pushParams.transition = Mojo.Transition.crossFade;
            }
            else
            {
                pushParams.transition = Mojo.Transition.zoomFade;
            }
            pushParams.assistantConstructor = Analytics.Scene[pushParams.name.capitalize().camelize()];
            sceneParams.applicationRoot = this.params.applicationRoot;
            this.controller.stageController.pushScene(pushParams, sceneParams);
        }
    },
    
    showAlert : function (text, type, delay, lines)
    {
        var pushAlert = function(stageController) {
            stageController.pushScene({
                assistantConstructor: Analytics.Scene.Alert,
                name: 'alert'
            }, {
                text: text,
                type: type,
                delay: delay
            });
        };
        if (!lines) lines = 1;
        var height = lines * 30;
        this.appController.createStageWithCallback({name: "alertStage", lightweight: true, height: height}, pushAlert, 'popupalert');
    },
    
    hideAlert : function ()
    {
        if (this.appController && this.appController.getStageProxy("alertStage"))
        {
            this.appController.getStageProxy("alertStage").window.close();
        }
    },
    
    hasScene : function (name)
    {
        var scenes = this.controller.stageController.getScenes();
        for (var i = 0; i < scenes.length; i++)
        {
            if (scenes[i].sceneName == name)
            {
                return true;
            }
        }
        return false;
    },
    
    handleCommand : function(event) {
        if (event.type == Mojo.Event.commandEnable)
        {
            switch(event.command) {
                case Mojo.Menu.prefsCmd:
                case Mojo.Menu.helpCmd:
                    event.stopPropagation();
                break;
            }
        }
        if(event.type == Mojo.Event.command)
        {
            switch(event.command) {
                case 'do-prefs':
                case Mojo.Menu.prefsCmd:
                    this.showScene("settings", {});
                    break;
                case 'do-about':
                    this.showScene("about", {});
                    break;
                case Mojo.Menu.helpCmd:
                    new Mojo.Service.Request("palm://com.palm.applicationManager", { 
                        method: "open", 
                        parameters: { 
                            id: 'com.palm.app.help'
                        }
                    });
                    break;
            }
        }
    },

    ready : function() {
    }
});

