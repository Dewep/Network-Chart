(function(){

    window.Router = function Router() {
        this.users = {};
        this.next_data = [];
        this.history_usage_data = [];
        this.history_usage_sum = 0;
        this.mac_addresses = [];

        var time = (new Date()).getTime() / 1000;
        var default_values = [];
        for (var i = 0; i < 20; i++) {
            default_values.push({ label: "Client " + (i + 1), values: [{time: time, y: 0}] });
        }
        this.router_chart = $('#componentRouterChart').epoch({
            type: 'time.area',
            data: default_values,
            axes: ['bottom', 'right'],
            tickFormats: {
                "bottom": function(d) {
                    var d = new Date(d * 1000);
                    return d.getHours() + ":" + (d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes());
                }
            },
            ticks: { time: 60 },
            windowSize: 300,
            fps: 1
        });

        this.dom_table = $("#componentRouterTable");
        this.dom_table_current_bytes = $("#componentRouterTableCurrentBytes");
        this.dom_table_current_packets = $("#componentRouterTableCurrentPackets");
        this.dom_table_total_bytes = $("#componentRouterTableTotalBytes");
        this.dom_usage_current = $("#componentRouterCurrent");
        this.dom_usage_average = $("#componentRouterAverage");
        this.dom_captions = $("#componentRouterChartCaptions");
    };

    window.Router.prototype.execute = function Router_Execute() {
        var self = this;
        self.update();
        setInterval(function(){
            self.update()
        }, 1000);
    };

    // users: {mac1: {mac, ip, name, is_me}, ... }
    window.Router.prototype.updateUsers = function Router_updateUsers(users) {
        this.users = users;
    };

    // stats: [ {mac, ip, packets: {current, total}, bytes: {current, total}}, ... ]
    window.Router.prototype.addData = function Router_addData(stats) {
        this.next_data.push(stats);
    };

    window.Router.prototype.update = function Router_Update() {
        var data = [];
        var i = 0;
        var j = 0;

        var time = ((new Date()).getTime() / 1000) | 0;
        for (i = 0; i < 20; i++) {
            data.push({time: time, y: 0});
        }

        var stats = this.next_data.shift();
        $("> tr", this.dom_table).remove();
        $("> span", this.dom_captions).remove();
        var total_current_bytes = 0;
        var total_current_packets = 0;
        var total_bytes = 0;
        var usage_current = 0;

        for (i = 0; stats && i < stats.length && i < 20; i++) {
            var stat = stats[i];
            var pos = this.mac_addresses.indexOf(stat.mac);
            if (pos == -1 && this.mac_addresses.length < 20) {
                this.mac_addresses.push(stat.mac);
                pos = this.mac_addresses.length - 1;
            }

            if (pos >= 0) {
                data[pos].y = (stat.bytes.current / 1000).toFixed(0) * 1;
            }

            var user = this.users[stat.mac];

            var tr = $("<tr>");
            tr.append($("<td>").append($("<span>").addClass("label").css("background", d3.scale.category20().range()[pos]).text(user ? user.name : "?")));
            tr.append($("<td>").text(stat.mac));
            tr.append($("<td>").text(user ? user.ip : stat.ip));
            tr.append($("<td>").text((stat.bytes.current / 1000).toFixed(0) + " kb/s"));
            tr.append($("<td>").text(stat.packets.current));
            tr.append($("<td>").text((stat.bytes.total / 1000000).toFixed(1) + " Mb"));
            if (stat.bytes.current > 1000) {
                tr.addClass("info");
            }
            this.dom_table.append(tr);

            this.dom_captions.append($("<span>").addClass("label").css("background", d3.scale.category20().range()[pos]).text(user ? user.name : "?")).append(" ");

            total_current_bytes += stat.bytes.current;
            total_current_packets += stat.packets.current;
            total_bytes += stat.bytes.total;

            if (user && user.is_me) {
                usage_current = (stat.bytes.current / 1000).toFixed(0) * 1;
            }
        }

        this.history_usage_data.push(usage_current);
        this.history_usage_sum += usage_current;
        if (this.history_usage_data.length > 300) {
            var value = this.history_usage_data.shift();
            this.history_usage_sum -= value;
        }

        this.dom_table_current_bytes.text((total_current_bytes / 1000).toFixed(0) + " kb/s");
        this.dom_table_current_packets.text(total_current_packets);
        this.dom_table_total_bytes.text((total_bytes / 1000000).toFixed(1) + " Mb");
        this.dom_usage_current.text(usage_current);
        this.dom_usage_average.text((this.history_usage_sum / this.history_usage_data.length).toFixed(0));

        this.router_chart.push(data);
    };

})();
