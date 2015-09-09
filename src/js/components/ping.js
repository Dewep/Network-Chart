(function(){

    var child_process = require("child_process");

    window.Ping = function Ping(ip) {
        this.ip = ip;
        this.dom_current = $("#componentPingCurrent");
        this.dom_average = $("#componentPingAverage");
        this.dom_packets_lost = $("#componentPingPacketsLost");
        this.dom_packets = $("#componentPingPackets");

        this.next_ping = [];
        this.history_data = [];
        this.history_len = 0;
        this.history_sum = 0;
        this.history_quality_data = [];
        this.history_quality_lost = 0;

        this.ping_chart = $('#componentPingChart').epoch({
            type: 'time.bar',
            data: [{ label: "layer-ping", values: [{time: ((new Date()).getTime() / 1000) | 0, y: 0}] }, { label: "Layer 1", values: [{time: ((new Date()).getTime() / 1000) | 0, y: 0}] }],
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

        this.packets_chart = $('#componentPingPacketsChart').epoch({
            type: 'time.gauge',
            value: 1,
            domain: [0, 1],
            format: function(v){
                return (v * 100).toFixed(2) + '%';
            },
            fps: 1
        });
    };

    window.Ping.prototype.execute = function Ping_Execute() {
        this.spawn();
        var self = this;
        self.update();
        setInterval(function(){
            self.update()
        }, 1000);
    };

    window.Ping.prototype.update = function Ping_Update() {
        var value = this.next_ping.shift();
        var time = ((new Date()).getTime() / 1000) | 0;
        if (value) {
            this.ping_chart.push([{ time: time, y: value }, { time: time, y: 0 }]);
            this.dom_current.text(value);
            this.history_data.push(value);
            this.history_len++;
            this.history_sum += value;
        } else {
            this.ping_chart.push([{ time: time, y: 0 }, { time: time, y: 10 }]);
            this.dom_current.text("~");
            this.history_data.push(0);
        }
        if (this.history_quality_data.length > 0) {
            this.packets_chart.update(1 - this.history_quality_lost / this.history_quality_data.length);
        }
        this.dom_packets_lost.text(this.history_quality_lost);
        this.dom_packets.text(this.history_quality_data.length);
        if (this.history_data.length > 300) {
            value = this.history_data.shift();
            if (value > 0) {
                this.history_len--;
                this.history_sum -= value;
            }
        }
        this.dom_average.text((this.history_sum / this.history_len).toFixed(0));
    };

    window.Ping.prototype.spawn = function Ping_Spawn() {
        var spawn = child_process.spawn;
        var ping = spawn('ping', [this.ip, "-t"]);
        var buf = "";
        var self = this;
        ping.stdout.on('data', function(bin) {
            buf += bin.toString();
            var lines = buf.split("\n");
            buf = lines[lines.length - 1];
            for (var i = 0; i < lines.length - 1; i++) {
                var value = lines[i].match(/=(\d+)( )?ms/);
                if (value) {
                    self.next_ping.push(parseInt(value[1]));
                    self.history_quality_data.push(0);
                } else if (lines[i].length > 1 && lines[i].indexOf(self.ip) == -1) {
                    self.history_quality_data.push(1);
                    self.history_quality_lost += 1;
                }
                if (self.history_quality_data.length > 300) {
                    self.history_quality_lost -= self.history_quality_data.shift();
                }
            }
        });
        ping.stdout.on('end', function(bin){});
        ping.on('exit', function(code){});
    };

})();
