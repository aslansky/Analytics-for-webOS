StageAssistant = Class.create({
    initialize : function (stageController)
    {
        AppAssistant.prototype.dealWithDeferredParams(stageController);
    },
    cleanup : function ()
    {
        Analytics.Model.Accounts.getInstance().cleanup();
        Analytics.Model.Profiles.getInstance().cleanup();
        Analytics.Model.Api.getInstance().cleanup();
        Analytics.Model.Api.getInstance().cleanup();
        Analytics.Util.DataStore.getInstance().cleanup();
    }
});