# What is Portmon ?

Portmon is a simple electron based Portmonitor.

## Blog

[Portmon](http://sandipchitale.blogspot.com/2016/04/electron-based-portmon-tool.html)

## Using Portmon

```
git clone https://github.com/sandipchitale/eportmon.git
cd eportmon
npm install
npm start
```

## To build executable

```
npm install electron-packager -g

electron-packager . eportmon --platform=win32 --arch=all -icon=ico\eportmon.ico
```
