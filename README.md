# TP-Link-Chart
Charts/statistics for TP Link router.

## Preview
![Preview](https://github.com/Dewep/TP-Link-Chart/raw/master/assets/preview.png)

## Build
```bash
#> apt-get install node npm
#> npm install nw-builder -g
#> git clone git@github.com:Dewep/Network-Chart.git
#> cd Network-Chart/
#> mkdir build
#> cp icon.png LICENSE package.json src/ build/ -r
#> rm build/src/css/bootstrap.min.css build/src/css/bootstrap-theme.min.css
#> nwbuild -p win64 -o /tmp/nwbuild -v 0.12.3 build/
```
