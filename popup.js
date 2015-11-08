// Copyright (c) 2015 Timothy Jensen & Alexander Tappin. All rights reserved.

var app = angular.module('app', []);

app.controller('appCtrl', function($scope, $q){
  $scope.hoverIn = function(){
    this.hoverEdit = true;
  };

  $scope.hoverOut = function(){
    this.hoverEdit = false;
  };

  getCurrentTabUrl(function(url) {
    document.getElementById("note-area").focus();

    $scope.loadUrl = function(url) {
      chrome.tabs.update({url: url});
    };

    $scope.loadNotes = function() {
      var deferred = $q.defer();
      chrome.storage.sync.get(function(storedNotes) {
          if (!chrome.runtime.error) {
            deferred.resolve(storedNotes.data);
          }
        });
      return deferred.promise;
    };

    $scope.cancel = function() {
      console.log("clicked the button");
      chrome.storage.sync.clear(function(storedNotes) {});
    };

    $scope.viewAll = function() {
      $scope.loadNotes().then(function(data) {
        $scope.noteList = data;
        console.log($scope.noteList);
      });
      displayNoteList();
    };

    $scope.saveNote = function() {
      var noteText = document.getElementById("note-area").innerText;
      var currentDate = getCurrentDate();

      var newNoteData = {
        noteText: noteText,
        url: url,
        date: currentDate
      };

      chrome.storage.sync.get(function(storedNotes) {
        if(typeof(storedNotes.data) !== 'undefined' && storedNotes.data instanceof Array) {
          storedNotes.data.unshift(newNoteData);
        } else {
          storedNotes.data = [newNoteData];
        }
        chrome.storage.sync.set(storedNotes, function() {
          if (chrome.runtime.error) {
            console.log("RuntimeError.");
          }
        });
        window.close();
      });
    };

    $scope.deleteNote = function(index) {
      chrome.storage.sync.get(function(storedNotes) {
        if(typeof(storedNotes.data) !== 'undefined' && storedNotes.data instanceof Array) {
          storedNotes.data.splice(index, 1);
        } else {
          console.log("Error, there were no notes to delete");
        }
        chrome.storage.sync.set(storedNotes, function() {
          if (chrome.runtime.error) {
            console.log("RuntimeError.");
          }
        });
      });
      $scope.noteList.splice(index, 1);
    };

  });
});

function loadNotes() {
  chrome.storage.sync.get(function(storedNotes, callback) {
    if (!chrome.runtime.error) {
     // console.log(storedNotes["data"]);
      callback()
      //https://www.google.com/
      //chrome.tabs.update({url: "https://www.google.com/"});
    }
  })
}

function displayNoteList() {
  document.getElementById('new-note').className += "display-nothing";
  document.getElementById('note-list').className =
      document.getElementById('note-list').className.replace(
          /(?:^|\s)display-nothing(?!\S)/g , ''
      )
}

function getCurrentDate() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1; //January is 0!
  var yyyy = today.getFullYear();

  if(dd<10) {
    dd='0'+dd
  }

  if(mm<10) {
    mm='0'+mm
  }

  today = mm+'/'+dd+'/'+yyyy;
  return today;
}

/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, function(tabs) {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}