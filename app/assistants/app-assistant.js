AppAssistant = Class.create({

    name : "AppAssistant",
    baseScene : {
        name: "dashboard",
        assistantConstructor: Analytics.Scene.Dashboard
    },
    settingsScene : {
        name: "settings",
        assistantConstructor: Analytics.Scene.Settings
    },
    initialize: function()
    {
    },

    handleLaunch: function(params)
    {
        if (!AppAssistant.stageController) {
            AppAssistant.deferredParams = params || {};
            return;
        }

        if (params) {
            AppAssistant.prototype.dealWithParams(params, true);
            return;
        }
        AppAssistant.stageController.activate();
    },
    
    dealWithDeferredParams: function(stageController)
    {
        AppAssistant.stageController = stageController;
        AppAssistant.prototype.dealWithParams(AppAssistant.deferredParams);
    },
    
    dealWithParams: function(params, deferActivate)
    {
        if (!AppAssistant.stageController.topScene()) {
            AppAssistant.stageController.pushScene(this.baseScene);
        } else {
            AppAssistant.stageController.popScenesTo(this.baseScene.name);
        }
        if (!Analytics.Util.Settings.getInstance().get("global") || !Analytics.Util.Settings.getInstance().get("global").firstSetup)
        {
            AppAssistant.stageController.pushScene(this.settingsScene);
        }
    }
});