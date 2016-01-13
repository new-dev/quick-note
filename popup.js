// Copyright (c) 2015 Timothy Jensen & Alexander Tappin. All rights reserved.

var app = angular.module('app', []);

app.controller('appCtrl', function($scope, $q){
  $scope.hoverIn = function() {
    this.hoverEdit = true;
  };

  $scope.hoverOut = function() {
    this.hoverEdit = false;
  };

  $scope.editable = function() {
    this.enableEdit = true;
  };

  $scope.nonEditable = function() {
    this.enableEdit = false;
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
      window.close();
    };

    $scope.viewAll = function() {
      $scope.loadNotes().then(function(data) {
        $scope.noteList = data;
      });
      displayNoteList();
    };

    $scope.viewCreateNote = function() {
      displayCreateNote();
    };

    $scope.noteIsSavable = function() {
      return document.getElementById("note-area").innerText;
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
      return $scope.noteList.splice(index, 1);
    };

    $scope.editNote = function(index) {
      var editedNoteData = $scope.deleteNote(index);
      editedNoteData[0].noteText = document.getElementById("text"+index).innerText;

      document.getElementById("text"+index).innerText = editedNoteData[0].noteText;
      $scope.noteList.unshift(editedNoteData[0]);

      chrome.storage.sync.get(function(storedNotes) {
        storedNotes.data = $scope.noteList;
        chrome.storage.sync.set(storedNotes, function() {
          if (chrome.runtime.error) {
            console.log("RuntimeError.");
          }
        });
      });
    };

    $scope.focusOnEdit = function(index) {
      console.log("focus");
      window.setTimeout(function() {
        document.getElementById("text"+index).focus();
      }, 0);

    };

  });
});

function displayNoteList() {
  document.getElementById('new-note').className += "display-nothing";
  document.getElementById('note-list').className =
      document.getElementById('note-list').className.replace(
          /(?:^|\s)display-nothing(?!\S)/g , ''
      )
}

function displayCreateNote() {
  if (document.getElementById('new-note').className != "display-nothing") {

  } else {
    document.getElementById('note-list').className += "display-nothing";
    document.getElementById('new-note').className =
        document.getElementById('new-note').className.replace(
            /(?:^|\s)display-nothing(?!\S)/g , ''
        )
  }
}

function getCurrentDate() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1; //January is 0!
  var yyyy = today.getFullYear();

  if (dd < 10) {
    dd = '0' + dd
  }

  if (mm < 10) {
    mm = '0' + mm
  }

  today = mm+'/'+dd+'/'+yyyy;
  return today;
}

function getCurrentTabUrl(callback) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    var tab = tabs[0];

    var url = tab.url;
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });
}