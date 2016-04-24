(function(){
  const process = require('process');
  const spawn = require('child_process').spawn;
  const remote = require('remote');

  angular
  .module('EportmonApp', [])
  .controller('EportmonCtrl', ['$scope', '$window', '$log', function($scope, $window, $log){
    var vm = this;
    vm.wait = false;

    vm.listeningOnly = true;
    vm.onlyPorts = '';
    vm.onlyPortsArray = [];
    vm.ports = [];
    vm.filterPorts = function(portLine) {
      return (!vm.listeningOnly || portLine[2] === 'LISTENING') &&
             (vm.onlyPortsArray.length === 0 || vm.onlyPortsArray.indexOf(portLine[1]) !== -1);
    }

    vm.orderByPorts = function(portLine) {
      return parseInt(portLine[1]);
    }

    vm.killProcess = function(PID) {
      if (angular.isString(PID)) {
        PID = parseInt(PID);
      }
      if (angular.isNumber(PID)) {
        if ($window.confirm('Kill process: ' + PID)) {
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
            netstat();
          });
        }
      }
    }

    function netstat() {
      var portLines = '';

      vm.onlyPortsArray = vm.onlyPorts.split(/,/);
      if (vm.onlyPortsArray.length > 0 && vm.onlyPortsArray[0] === '') {
        vm.onlyPortsArray.splice(0,1);
      }

      vm.wait = true;
      vm.ports = [];

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
        portLines = portLines.split(/\r\n/);
        $scope.$apply(function() {
          if (angular.isArray(portLines) && portLines.length > 5) {
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
            vm.ports = portLines;
          }
        });
      });
    }
    vm.netstat = netstat;

    vm.quit = function() {
      remote.getCurrentWindow().close();
    };

    netstat();
  }]);
})();
