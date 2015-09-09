(function(){

    var http = require("http");
    var os = require('os');

    window.Router_TPLink = function Router_TPLink(ip, username, password) {
        this.ip = ip;
        this.authorization = encodeURIComponent("Basic " + btoa(username + ":" + password));
        this.router = null;
        this.user_mac_addresses = [];
        this.my_mac_addresses = [];

        var interfaces = os.networkInterfaces();
        for (var i in interfaces) {
            for (var j in interfaces[i]) {
                var address = interfaces[i][j];
                if (address.family === 'IPv4' && !address.internal) {
                    this.my_mac_addresses.push(address.mac.replace(/:/g, "-").toUpperCase());
                }
            }
        }

        this.dom_reset = $("#componentRouterReset");
    };

    window.Router_TPLink.prototype.execute = function Router_TPLink_Execute(router) {
        this.router = router;
        var self = this;

        self.updateData();
        setInterval(function(){
            self.updateData()
        }, 5000);

        this.dom_reset.click(function(){
            self.request("/userRpm/SystemStatisticRpm.htm?DeleteAll=All").then(function success(response) {
                document.location.reload();
            }, function failure(error) {
                console.error("Router_TPLink_delete", error);
            });
        });
    };

    window.Router_TPLink.prototype.updateUsers = function Router_TPLink_UpdateUsers() {
        var self = this;
        this.request("/userRpm/AssignedIpAddrListRpm.htm").then(function success(response) {
            var users = {};
            var lines = response.content.split("\n");
            self.user_mac_addresses = [];

            for (var i = 2; lines[i].indexOf(");") == -1; i++) {
                var user = eval("[" + lines[i] + "]");
                self.user_mac_addresses.push(user[1]);
                users[user[1]] = {
                    mac: user[1],
                    ip: user[2],
                    name: user[0],
                    is_me: self.my_mac_addresses.indexOf(user[1]) == -1 ? false : true
                };
            }

            self.router.updateUsers(users);
        }, function failure(error) {
            console.error("Router_TPLink_updateUsers", error);
        });
    };

    window.Router_TPLink.prototype.updateData = function Router_TPLink_UpdateData() {
        var self = this;
        this.request("/userRpm/SystemStatisticRpm.htm?interval=5&Refresh=Refresh&sortType=3&Num_per_page=20&Goto_page=1").then(function success(response) {
            var data = [];
            var update_users = false;
            var lines = response.content.split("\n");

            for (var i = 2; lines[i].indexOf(");") == -1; i++) {
                var stat = eval("[" + lines[i] + "]");
                if (self.user_mac_addresses.indexOf(stat[2]) == -1) {
                    update_users = true;
                }
                data.push({
                    mac: stat[2],
                    ip: stat[1],
                    packets: {
                        current: stat[5],
                        total: stat[3]
                    },
                    bytes: {
                        current: stat[6],
                        total: stat[4]
                    }
                });
            }

            if (update_users) {
                self.updateUsers();
            }

            for (var offset = 0; offset < 5; offset++) {
                self.router.addData(data);
            }
        }, function failure(error) {
            console.error("Router_TPLink_UpdateData", error);
        });
    };

    window.Router_TPLink.prototype.request = function Router_TPLink_Request(path) {
        var self = this;
        return new Promise(function(resolve, reject) {
            var ite = 0;
            var doRequest = function doRequest() {
                ite++;
                if (ite > 5) {
                    reject({"message": "Too much iteration"});
                } else {
                    http.get({
                        host: self.ip,
                        port: 80,
                        path: path,
                        headers: {
                            'Cookie': 'Authorization=' + self.authorization,
                            'Referer': 'http://' + self.ip + '/'
                        }
                    }, function(response) {
                        var body = '';
                        response.on('data', function(d) {
                            body += d;
                        });
                        response.on('end', function() {
                            if (body.indexOf("httpAutErrorArray") == -1) {
                                response.iteration = ite;
                                response.content = body;
                                resolve(response);
                            } else {
                                doRequest();
                            }
                        });
                    }).on('error', function(e) {
                        reject(e);
                    });
                }
            };
            doRequest();
        });
    };

})();
