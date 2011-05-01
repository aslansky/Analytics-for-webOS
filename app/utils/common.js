Analytics = {
    Util: {
        Singleton : {
            create : function singletonclass__create()
            {
                var ProtoClass = Class.create.apply(Class, arguments);
                var instance;
                ProtoClass = Class.create(ProtoClass, {
                    initialize : function($super)
                    {
                        if(instance) throw("cannot create another - this is a singleton");
                        $super();
                    }
                });
                instance = new ProtoClass();
                ProtoClass.getInstance = function ()
                {
                    return instance;
                };
                return ProtoClass;
            }
    	},
    	Database : {}
    },
	Scene : {},
	Model : {}
};