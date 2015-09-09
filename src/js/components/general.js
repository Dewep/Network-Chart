(function(){

    var gui = require('nw.gui');

    window.ComponentsExecute = function ComponentsExecute(components) {
        var instances = {};
        var i = 0;
        var j = 0;

        for (i = 0; i < components.length; i++) {
            components[i].name = components[i].type.name;

            var arguments = components[i].arguments || [];

            arguments.unshift(null);
            instances[components[i].name] = new (Function.prototype.bind.apply(components[i].type, arguments));
        }

        for (i = 0; i < components.length; i++) {
            var arguments = [];
            var dependencies = components[i].dependencies || [];

            for (j = 0; j < dependencies.length; j++) {
                arguments.push(instances[dependencies[j]]);
            }

            instances[components[i].name].execute.apply(instances[components[i].name], arguments);
        }
    };

    var shortcut = new gui.Shortcut({
        key : "Ctrl+Shift+I",
        active : function() {
            gui.Window.get().showDevTools();
        }
    });
    gui.App.registerGlobalHotKey(shortcut);

})();
