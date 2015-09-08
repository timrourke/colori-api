angular.module('colori', ['ngStorage', 'ngRoute', 'angular-jwt'])
.constant('urls', {
  BASE: 'http://localhost:8080/api'
})
.factory('Auth', ['$rootScope', '$http', '$localStorage', 'urls', '$location', function($rootScope, $http, $localStorage, urls, $location) {
  
  return {
    signup: function (data, success, error) {
      $http.post(urls.BASE + '/auth/signup', data).then(function(res){
        success
      }, function(res) {
        error
      });
    },
    login: function (data, success, error) {
      $http.post(urls.BASE + '/auth/login', data)
      .then(function(res){
        console.log(res);
        success(res.data)
      }, function(res) {
        error(res.data)
      });
    },
    logout: function () {
      data = {
        user: $localStorage.user,
        token: $localStorage.id_token
      }
      $http.get(urls.BASE + '/auth/logout', data)
        .then(function(res) {
          delete $localStorage.id_token;
          delete $localStorage.user;
          $rootScope.message = res.data.message;
          $location.path('/'); 
        }, function(res){
          delete $localStorage.id_token;
          delete $localStorage.user;
          //$rootScope.message = res.message;
          $location.path('/');
        });
      
    },
    getToken: function () {
      return $localStorage.id_token;  
    },
    getUser: function() {
      if ($localStorage.hasOwnProperty('user')) {
        return $localStorage.user;  
      } else {
        return "";
      }
    },
    successAuth: function(res) {
      $localStorage.id_token = res.user.token;
      $localStorage.user = res.user;
      $rootScope.message = res.message;
    }
  };

}])
.factory('Users', ['$http', 'urls', function($http, urls) {
  return {
    getUsers: function (success, error) {
      $http.get(urls.BASE + '/users').then(function(res){
        success(res.data);
      }, function(res) {
        error(res.data);
      });
    },
    getUser: function (username, success, error) {
      $http.get(urls.BASE + '/users/' + username).then(function(res){
        success(res.data);
      }, function(res) {
        error(res.data);
      });
    }
  }
}])
.config(function Config($routeProvider, $locationProvider, $httpProvider, jwtInterceptorProvider) {
  // Please note we're annotating the function so that the $injector works when the file is minified
  jwtInterceptorProvider.tokenGetter = ['$localStorage', 'Auth', function($localStorage, Auth) {
    return Auth.getToken();
  }];

  $httpProvider.interceptors.push('jwtInterceptor');

  $routeProvider.
    when('/login', {
      templateUrl: 'app/partials/login.html',
      controller: 'MainController'
    }).
    when('/signup', {
      templateUrl: 'app/partials/signup.html',
      controller: 'SignupController'
    }).
    when('/users', {
      templateUrl: 'app/partials/users.html',
      controller: 'UsersController'
    }).
    when('/users/:username', {
      templateUrl: 'app/partials/users.html',
      controller: 'UserController'
    }).
    otherwise({
      redirectTo: '/'
    });

    $locationProvider.html5Mode(true);
})
.controller('MainController', ['$rootScope', '$scope', '$location', '$localStorage', 'Auth', 
  function MainController($rootScope, $scope, $location, $localStorage, Auth) {

    $scope.$watch(function(scope){
      return Auth.getUser()
    }, function(newValue, OldValue) {
      $rootScope.user = newValue;
      $rootScope.token = newValue.token;  
    });

    $scope.login = function () {
      var formData = {
        username: $scope.username,
        password: $scope.password
      };

      Auth.login(formData, Auth.successAuth, function (res) {
        $rootScope.message = res.message;
      });
    };

    $scope.logout = function () {
      Auth.logout();
    };

  }
])
.controller('SignupController', ['$rootScope', '$scope', 'Auth', function($rootScope, $scope, Auth) {

  $scope.signup = function () {
    var formData = {
      username: $scope.username,
      email: $scope.email,
      password: $scope.password
    };

    Auth.signup(formData, Auth.successAuth, function (res) {
      $rootScope.message = res.message || 'Failed to sign up.';
    });
  };
}])
.controller('UsersController', ['$rootScope', '$scope', 'Users', function($rootScope, $scope, Users) {

  $scope.users = [];

  $scope.init = function() {
    Users.getUsers(function(res) {
      $scope.users = res.foundUsers;
    }, function(res) {
      $rootScope.message = res.message;
    });
  }

  $scope.init();

}])
.controller('UserController', ['$rootScope', '$scope', 'Users', '$routeParams', function($rootScope, $scope, Users, $routeParams) {

  $scope.users = [];

  $scope.init = function() {
    Users.getUser(
      $routeParams.username,
      function(res) {
        $scope.users.push(res.foundUser);
        $rootScope.message = res.message;
      }, function(res) {
        $rootScope.message = res.message;
      }
    );
  }

  $scope.init();

}])