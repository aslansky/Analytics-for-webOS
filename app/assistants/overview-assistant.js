Analytics.Scene.Overview = Class.create(Analytics.Util.Details, {
    
    initialize : function ($super, args)
    {
        $super(args);
        
        this.dataHandler = this.handleData.bind(this);
        this.chartHandler = this.handleChartData.bind(this);
        this.errorHandler = this.handleError.bind(this);
    },
    
    setup : function ($super)
    {
        $super();
    },
    
    aboutToActivate : function ($super, callback)
    {
        $super();
    },
    
    activate : function ($super)
    {
        $super();
    },
    
    deactivate : function ($super)
    {
        $super();
    },
    
    cleanup : function ($super)
    {
        this.dataHandler = null;
        this.chartHandler = null;
        this.errorHandler = null;
        
        $super();
    },
    
    refresh : function ()
    {
        this.store.invalidate(this.item.id, 'nums');
        this.store.invalidate(this.item.id, 'chart');
        this.showSpinner();
        this.getData();
    },
    
    getData : function ()
    {
        if (this.store.isValid(this.item.id, 'nums', this.period, this.startDate, this.endDate)) {
            this.getChartData();
        }
        else {
            if (!this.store.get(this.item.id, 'oauth_token')) {
                this.getAuth();
            }
            else {
                this.api.getData({
                    oauth_token: this.store.get(this.item.id, 'oauth_token'),
                    oauth_secret: this.store.get(this.item.id, 'oauth_secret'),
                    profileId: this.item.profileId,
                    metrics: 'ga:visits,ga:bounces,ga:pageviews,ga:newVisits,ga:timeOnSite,ga:visitors,ga:exits',
                    period: this.period,
                    dateFrom: this.startDate,
                    dateTo: this.endDate,
                    onSuccess: this.dataHandler,
                    onError: this.errorHandler
                });
            }
        }
    },
    
    getChartData : function ()
    {
        if (this.store.isValid(this.item.id, 'chart', this.period, this.startDate, this.endDate)) {
            this.render();
        }
        else {
            var dimension = 'ga:date';
            if (this.period == 'day') {
                dimension = 'ga:hour';
            }
            this.api.getData({
                oauth_token: this.store.get(this.item.id, 'oauth_token'),
                oauth_secret: this.store.get(this.item.id, 'oauth_secret'),
                profileId: this.item.profileId,
                metrics: 'ga:visits',
                dimensions: dimension,
                period: this.period,
                dateFrom: this.startDate,
                dateTo: this.endDate,
                onSuccess: this.chartHandler,
                onError: this.errorHandler
            });
        }
    },
    
    handleData : function (result, startDate, endDate)
    {
        this.store.set(this.item.id, 'period', this.period);
        this.store.set(this.item.id, 'startDate', startDate);
        this.store.set(this.item.id, 'endDate', endDate);
        if (startDate && endDate) {
            this.setTitle(startDate, endDate);
            this.startDate = startDate;
            this.endDate = endDate;
        }
        this.store.set(this.item.id, 'nums', result);
        this.getChartData();
    },
    
    handleChartData : function (result)
    {
        this.store.set(this.item.id, 'chart', result);
        this.render();
    },
    
    handleError : function (error)
    {
        console.log(Object.toJSON(error));
    },
    
    render : function ()
    {
        $('data-list').update();
        var obj = this.store.get(this.item.id, 'chart');
        var data = [];
        var start;
        var end;
        obj.each(function (item, index) {
            if (index == 0) {
                if (obj == 'day') {
                    start = item['ga:hour'];
                }
                else {
                    start = item['ga:date'];
                }
            }
            if (index == obj.length - 1) {
                if (obj == 'day') {
                    end = item['ga:hour'];
                }
                else {
                    end = item['ga:date'];
                }
            }
            data.push(item['ga:visits']);
        }, this);
        var max = this.max(data);
        var steps = Math.ceil(max / 2);
        var renderedInfo = Mojo.View.render({object: {
            translation: Analytics.Util.ListTranslation,
            image: 'http://chart.apis.google.com/chart?cht=ls&chs=273x100&chxs=0,969695,12,0,lt,969695&chxt=r&chco=4C91CC&chf=bg,s,E4E5E2&chm=B,C9DCEA,0,0,0|r,7E7F7D,0,0.499,0.501|r,7E7F7D,0,0.998,1.0|r,7E7F7D,0,0.0,0.002&chds=0,' + max + '&chxr=0,0,' + max + ',' + steps + '&chd=t:' + data.join(','),
            nums: {
                page: this.item.title,
                visits: Mojo.Format.formatNumber(Number(this.store.get(this.item.id, 'nums')["ga:visits"])),
                visitors: Mojo.Format.formatNumber(Number(this.store.get(this.item.id, 'nums')["ga:visitors"])),
                pageviews: Mojo.Format.formatNumber(Number(this.store.get(this.item.id, 'nums')["ga:pageviews"])),
                avgpageviews: Mojo.Format.formatNumber(Number(this.store.get(this.item.id, 'nums')["ga:pageviews"]) / Number(this.store.get(this.item.id, 'nums')["ga:visits"]), {fractionDigits: 2}),
                avgtimeonsite: this.secondsToTime(Number(this.store.get(this.item.id, 'nums')["ga:timeOnSite"])/Number(this.store.get(this.item.id, 'nums')["ga:visits"])),
                bounceRate: Mojo.Format.formatPercent((Number(this.store.get(this.item.id, 'nums')["ga:bounces"]) / Number(this.store.get(this.item.id, 'nums')["ga:visits"])) * 100),
                newvisits: Mojo.Format.formatPercent((Number(this.store.get(this.item.id, 'nums')["ga:newVisits"]) / Number(this.store.get(this.item.id, 'nums')["ga:visits"])) * 100)
            }
        }, template: 'overview/data-list'});
        this.controller.get('data-list').update(renderedInfo);
        this.hideSpinner();
    }
    
});