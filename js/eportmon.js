(function(){
  const process = require('process');
  const spawn = require('child_process').spawn;
  const remote = require('remote');
  const path = require('path');
  const pathExtra = require('path-extra');
  const fileSystem = require('fs');
  const shell = require('electron').shell

  angular
  .module('EportmonApp', [])
  .controller('EportmonCtrl', ['$scope', '$window', '$log', '$interval',function($scope, $window, $log, $interval){
    var vm = this;
    vm.wait = false;
    vm.updatedAt = new Date();

    var intervalId;
    vm.monitor = true;
    vm.toggleMonitoring = function() {
      vm.monitor = !vm.monitor;
      if (vm.monitor) {
        vm.doNetstat();
        startMonitoring();
      } else {
        stopMonitoring();
      }
    }

    function startMonitoring() {
      vm.netstat();
      intervalId = $interval(vm.netstat, 10000);
    }

    function stopMonitoring() {
      if (intervalId) {
        $interval.cancel(intervalId);
        intervalId = null;
      }
    }

    // Utility
    const isFile = function(path) {
      try {
        return fileSystem.statSync(path) && fileSystem.statSync(path).isFile()
      } catch (e) {
        return false;
      }
    }

    const isDirectory = function(path) {
      try {
        return fileSystem.statSync(path) && fileSystem.statSync(path).isDirectory()
      } catch (e) {
        return false;
      }
    }

    var eportmonSettingsFilePath = path.join(pathExtra.homedir(), '.portmon.json');
    var eportmonSettings = {
      ports: '4200,8080,8765,2910'
    }

    // save settings
    function saveSettings() {
      fileSystem.writeFileSync(eportmonSettingsFilePath, JSON.stringify(eportmonSettings, null, '  '));
    }

    // load settings
    function loadSettings() {
      if (isFile(eportmonSettingsFilePath)) {
          try {
              eportmonSettings = JSON.parse(fileSystem.readFileSync(eportmonSettingsFilePath));
          } catch (e) {
          }
      } else {
          saveSettings();
      }
    };
    loadSettings();

    vm.listeningOnly = true;
    vm.onlyPorts = eportmonSettings.ports;
    vm.onlyPortsArray = [];
    vm.ports = [];

    vm.portsChanged = function() {
      eportmonSettings.ports = vm.onlyPorts;
      saveSettings();
    }

    vm.filterPorts = function(portLine) {
      return (!vm.listeningOnly || portLine[2] === 'LISTENING') &&
              (vm.onlyPortsArray.length === 0 || vm.onlyPortsArray.indexOf(portLine[1]) !== -1);
    }

    vm.orderByPorts = function(portLine) {
      return parseInt(portLine[1]);
    }

    vm.killProcess = function(event, PID) {
      if (angular.isString(PID)) {
        PID = parseInt(PID);
      }
      if (angular.isNumber(PID)) {
        if (!event.ctrlKey && !$window.confirm('Kill process: ' + PID)) {
          return;
        }
        $log.info('Killing process: ' + PID);
        const kp = (process.platform === 'win32') ?
          spawn('taskkill', ['/F', '/PID', '' + PID]) : spawn('kill', ['-9', '' + PID]);
        kp.stdout.on('data', function(output) {
          $log.debug(String.fromCharCode.apply(null, output));
        });

        kp.stderr.on('data', (err) => {
          $log.debug(err);
        });

        kp.on('close', (code) => {
          $log.debug('Exit code: ' + code);
          vm.netstat();
        });
      }
    }

    vm.doNetstat =function () {
      var portLines = '';

      vm.onlyPortsArray = vm.onlyPorts.split(/,/);
      if (vm.onlyPortsArray.length > 0 && vm.onlyPortsArray[0] === '') {
        vm.onlyPortsArray.splice(0,1);
      }

      vm.wait = true;
      //vm.ports = [];

      const ns = (process.platform === 'win32') ?
              spawn('netstat', ['-anop', 'tcp']) : spawn('netstat', ['-anp', '--tcp']);
      ns.stdout.on('data', function(pls) {
        portLines += String.fromCharCode.apply(null, pls).substring(1);
      });

      ns.stderr.on('data', (err) => {
        $log.error(err);
      });

      ns.on('close', (code) => {
        vm.wait = false;
        vm.updatedAt = new Date();
        portLines = portLines.split(/\r\n/);
        $scope.$apply(function() {
          if (angular.isArray(portLines) && portLines.length > 5) {
            try {
              portLines.splice(0, 5);
              if (portLines[portLines.length-1] === '') [
                portLines.splice(portLines.length-1, 1)
              ]
              angular.forEach(portLines, function(portLine, index, portLines) {
                portLines[index] = portLine.split(/\s+/);
                portLines[index].splice(3,1);
                portLines[index].splice(0,1);
                portLines[index][1] = portLines[index][1].split(/:/);
                portLines[index][1].splice(0,1);
                portLines[index][1] = portLines[index][1][0];
              });
              if (vm.listeningOnly) {
                portLines.filter(function(portLine) {
                  return portLine[2]  === 'LISTENING';
                });
              }
              vm.ports = portLines;
            } finally {

            }
          }
        });
      });
    }

    vm.netstat = function () {
      if (vm.monitor) {
        vm.doNetstat();
      }
    }

    vm.github = function () {
      shell.openExternal('https://github.com/sandipchitale/eportmon/');
    }

    vm.quit = function() {
      remote.getCurrentWindow().close();
    };

    startMonitoring();

  }]);
})();
