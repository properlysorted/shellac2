/** App initialization */
var app = angular.module('ShellacApp', [
	'ngRoute',
	'fmangular',
	'fmangular.ui'
]);


/** Configure routes to pages */
app.config(function ($routeProvider) {
	$routeProvider.when('/', {
		templateUrl: 'views/home.html',
        controller: 'HomeCtrl'
	}).when('/artists', {
		templateUrl: 'views/artist_list.html',
		controller: 'ListCtrl'
	}).when('/artists/:id', {
		templateUrl: 'views/artist_detail.html',
		controller: 'DetailCtrl'
    }).when('/take', {
		templateUrl: 'views/music_list.html',
		controller: 'MusicListCtrl'
	}).when('/take/:id', {
		templateUrl: 'views/music_detail.html',
		controller: 'MusicDetailCtrl'
	}).when('/search', {
		templateUrl: 'views/search.html',
		controller: 'SearchCtrl'
	}).otherwise({
		redirectTo: '/'
	})
});


/** Global controller */
app.controller('MainCtrl', ['$route', '$routeParams', '$location',
  function($route, $routeParams, $location) {
    
    this.$route = $route;
    this.$location = $location;
    this.$routeParams = $routeParams;
    var curURL = $location.absUrl();
    this.pathToImages = (curURL.split('#'))[0] + 'images/';

}]);


/** Home controller */
app.controller('HomeCtrl', function ($scope, fmangular, $location) {
    
	fmangular.findAll({'-db': 'Shellac', '-lay': 'abc'}).then(function (found) {
        
        //  All records in hp layout
        $scope.shellac = found[0];
        
    }, function(err) {
		alert('Could not fetch list of tasks: ' + err.message);
	});
	
});


/** Artist List view controller */
app.controller('ListCtrl', function ($scope, fmangular, $location) {
    
	fmangular.findAll({'-db': 'Shellac', '-lay': 'wla'}).then(function (found) {
		
        //  All records in wla layout
        $scope.shellac = found;
        
        //  New data model for role info in wla layout.  Exports
        //  $scope.artistRoles which contains a list of distinct role names
        //  found in the records in this layout along with the number of
        //  records each role appears in.
        
        /*  First, loop through $scope.shellac populating roleCounts with the
         *  distinct role names and how many times each appears.  */
        
        //  CODE TO COUNT AND DISPLAY THE NUMBER OF TIMES EACH ROLE SHOWS UP
        //  IN RECORD SET.  REMOVED PER CLIENT BUT LEFT BELOW IN CASE IT EVER
        //  NEEDS TO COME BACK.
        var roleCounts = [];
        $scope.shellac.forEach(function(record) {
            var roleNames = record.roles.split("\n");
            roleNames.forEach(function(roleName) {
                if (roleName) {
                    if (roleName in roleCounts) {
                        roleCounts[roleName]++;                     
                    } else {
                        roleCounts[roleName] = 1;
                    }
                }
            });
        });

        /*  Next, loop through roleCounts and push each element into a new
         *  iterable multi-dimensional array called sortedRoleCounts so that we
         *  can sort the role names alphabetically below.  */
        var sortedRoleCounts = [];
        for (var role in roleCounts) {
            sortedRoleCounts[sortedRoleCounts.length] = [role, roleCounts[role]];
        }
        
        /*  Sort sortedRoleCounts alphabetically by role name.  */
        sortedRoleCounts.sort(function(a, b) {
            a = a[0];
            b = b[0];
            return a < b ? -1 : (a > b ? 1 : 0);
        });

        /*  Finally, loop through the newly sorted array of role names and
         *  counts, pushing the values into $scope.artistRoles to be exported
         *  to the template and used in the role filter.  */
        $scope.artistRoles = [{value: 'all', label: 'All Roles'}];
        $scope.selectedRole = 'all';
        $scope.filterArtistRoles = $scope.artistRoles[0];
        for (var i=0; i<sortedRoleCounts.length; i++) {
            var roleName = sortedRoleCounts[i][0];
            var optionValue = roleName;
            var roleCount = sortedRoleCounts[i][1];
            $scope.artistRoles[$scope.artistRoles.length] = { value: optionValue, label: roleName };
            //  Swap line above with line below to begin display role counts again.
            //  $scope.artistRoles[$scope.artistRoles.length] = { value: optionValue, label: roleName + ' (' + roleCount + ')' };
        }

	}, function(err) {
		alert('Could not fetch list of artists: ' + err.message);
	});
    

    //  Code to sort Artist List View by column heading
    /*  Default to an ascending sort on the "name" column and initialize
     *  $scope.lastColClicked   */
    $scope.orderByField = 'name';   
    $scope.reverseSort = false;
    $scope.lastColClicked = $scope.orderByField;
    
    /*  setReverseSort() is bound to ng-click on column headers.  If the user
     *  just clicked on a new column, set the reverse order to match
     *  initialSortOrder.  Otherwise, if we're currently in a descending sort,
     *  return an ascending sort and vice versa.  */
    $scope.setReverseSort = function(clickedCol, initialSortOrder, curReverseSort) {
        var returnVal;
        if ($scope.lastColClicked != clickedCol) {
            returnVal = (initialSortOrder == 'asc') ? false : true;
            $scope.lastColClicked = clickedCol;
        } else {
            returnVal = (curReverseSort) ? false : true;
        }
        return returnVal;
    };
    
    
    //  Code to filter Artist List View by Artist Country (tInclude)
    /*  Define the options in the filter dropdown for the user and set the
     *  initial filter type to "all".  */
    $scope.filterableNationalities = [
        {
            value: 'norwegian',
            label: 'Norwegian Only'
        },
        {
            value: 'foreign',
            label: 'Foreign Only'
        },
        {
            value: 'all',
            label: 'All'
        }
    ];
    
    $scope.selectedNationality = 'norwegian';
    $scope.filterArtistNationalities = $scope.filterableNationalities[0];
    
    
    /*  Based on the value of $scope.selectedNationality determine whether to
     *  display all artists, foreign only or Norwegian only (defined by artists'
     *  _fkArtistTypeId values)   */
    $scope.limitCountryTo = function(element) {
        if (! $scope.selectedNationality || $scope.selectedNationality == 'all') {
            return (element._fkArtistTypeId == 208 || element._fkArtistTypeId == 209) ? true : false;
        } else if ($scope.selectedNationality == 'norwegian' && element._fkArtistTypeId == 208) {
            return true;
        } else if ($scope.selectedNationality == 'foreign' && element._fkArtistTypeId == 209)  {
            return true;
        } else {
            return false;
        }
    };
    
    
    /*  Based on the value of $scope.selectedRole determine whether to
     *  display all artists or only those whose roles value includes the string
     *  defined in $scope.selectedRole   */
    $scope.selectedRole = 'all';
    $scope.limitRoleTo = function(element) {
        if (! $scope.selectedRole || $scope.selectedRole == 'all') {
            return true;
        } else {
            var roles = element.roles.split('\n');
            var returnVal = false;
            for (var i=0; i<= roles.length; i++) {
                if (roles[i] == $scope.selectedRole) {
                    returnVal = true;
                    break;
                }
            }
            return returnVal;
        }
    };
    
    
    //  Code for Artist List pagination by way of "Prev" and "Next" links
    /*  The "slice" filter below is placed on the ng-repeat directive used to
     *  build the list of artists.  It takes two arguments -- listOffset and
     *  listEnd -- to determine which slice of $scope.shellac to display.
     *  listOffset decides the starting index and listLength says how many
     *  elements from that point to travel.  listOffset is set to 0 below so
     *  that the default behavior is always to start at the beginning of
     *  $scope.shellac, and listLength is set to however many records you want
     *  to have displayed on screen at a time. */
    
    $scope.listOffset = 0;
    $scope.listLength = 40;
    $scope.listEnd = $scope.listOffset + $scope.listLength;
    
    /*  Increment listOffset and listEnd by + listLength causing the next
     *  listLength number of records to be displayed.   */
    $scope.pageForward = function() {
        /*  Uncomment line below if using "Prev" and "Next" buttons to 
         *  additional artist records as opposed to loading it in through
         *  infinite scrolling.  */
        // $scope.listOffset += $scope.listLength;
        $scope.listEnd += $scope.listLength;
    };

    
    /*  Increment listOffset and listEnd by - listLength causing the previous
     *  listLength number of records to be displayed.   */
    $scope.pageBack = function() {
        $scope.listOffset -= $scope.listLength;
        $scope.listEnd -= $scope.listLength;
    };

    
});


/** Music List view controller */
app.controller('MusicListCtrl', function ($scope, fmangular, $location) {
    
	fmangular.findAll({'-db': 'Shellac', '-lay': 'wml'}).then(function (found) {
        
        //  All records in wla layout
        $scope.shellac = found;
	
        //  New data models based on info in wml layout.  Exports
        //  $scope.companies, $scope.composers and $scope.venues which contain
        //  lists of distinct companies, composers and venus found in the records
        //  in this layout along with the number of records each appears in.
        
        /*  First, loop through $scope.shellac populating companyCounts,
         *  composerCounts and venueCounts with the distinct names and how many
         *  times each appears.  */
        var companyCounts = [];
        var composerCounts = [];
        var venueCounts = [];
        $scope.shellac.forEach(function(record) {

            var company = record.company;
            var composer = record.composer;
            var venue = record.place;

            if (company) {
                if (company in companyCounts) {
                    companyCounts[company]++;                     
                } else {
                    companyCounts[company] = 1;
                }
            }
            
            if (composer) {
                if (composer in composerCounts) {
                    composerCounts[composer]++;                     
                } else {
                    composerCounts[composer] = 1;
                }
            }
            
            if (venue) {
                if (venue in venueCounts) {
                    venueCounts[venue]++;                     
                } else {
                    venueCounts[venue] = 1;
                }
            }
        });

        /*  Next, loop through companyCounts, composerCounts and venueCounts and
         *  push each element into new iterable multi-dimensional arrays called
         *  sortedArtistCounts, sortedComposerCounts and sortedVenueCounts so
         *  that we can sort each alphabetically below.  */
        var sortedCompanyCounts = [];
        for (var company in companyCounts) {
            sortedCompanyCounts[sortedCompanyCounts.length] = [company, companyCounts[company]];
        }
        
        var sortedComposerCounts = [];
        for (var composer in composerCounts) {
            sortedComposerCounts[sortedComposerCounts.length] = [composer, composerCounts[composer]];
        }
        
        var sortedVenueCounts = [];
        for (var venue in venueCounts) {
            sortedVenueCounts[sortedVenueCounts.length] = [venue, venueCounts[venue]];
        }
        
        /*  Sort sortedCompanyCounts, sortedComposerCounts and sortedVenueCounts
         *  alphabetically by name.  */
        sortedCompanyCounts.sort(function(a, b) {
            a = a[0];
            b = b[0];
            return a < b ? -1 : (a > b ? 1 : 0);
        });
        
        sortedComposerCounts.sort(function(a, b) {
            a = a[0];
            b = b[0];
            return a < b ? -1 : (a > b ? 1 : 0);
        });
        
        sortedVenueCounts.sort(function(a, b) {
            a = a[0];
            b = b[0];
            return a < b ? -1 : (a > b ? 1 : 0);
        });

        /*  Finally, loop through the newly sorted array of company, composer
         *  and venue names and counts, pushing the values into $scope.companies,
         *  $scope.composers and $scope.venues to be exported to the template
         *  and used in the filters.  */
        $scope.companies = [{value: 'all', label: 'All Companies'}];
        for (var i=0; i<sortedCompanyCounts.length; i++) {
            var companyName = sortedCompanyCounts[i][0];
            var optionValue = companyName;
            optionValue = optionValue.replace(/\(/g, '\\(');
            optionValue = optionValue.replace(/\)/g, '\\)');
            var companyCount = sortedCompanyCounts[i][1];
            $scope.companies[$scope.companies.length] = { value: optionValue, label: companyName };
            //  Swap line below with line above to include company counts
            //  $scope.companies[$scope.companies.length] = { value: optionValue, label: companyName + ' (' + companyCount + ')' };
        }
        
        $scope.composers = [{value: 'all', label: 'All Composers'}];
        for (var i=0; i<sortedComposerCounts.length; i++) {
            var composerName = sortedComposerCounts[i][0];
            var optionValue = composerName;
            optionValue = optionValue.replace(/\(/g, '\\(');
            optionValue = optionValue.replace(/\)/g, '\\)');
            var composerCount = sortedComposerCounts[i][1];
            $scope.composers[$scope.composers.length] = { value: optionValue, label: composerName };
            //  Swap line below with line above to include composer counts
            //  $scope.composers[$scope.composers.length] = { value: optionValue, label: composerName + ' (' + composerCount + ')' };
        }
        
        $scope.venues = [{value: 'all', label: 'All Venues'}];
        for (var i=0; i<sortedVenueCounts.length; i++) {
            var venueName = sortedVenueCounts[i][0];
            var optionValue = venueName;
            optionValue = optionValue.replace(/\(/g, '\\(');
            optionValue = optionValue.replace(/\)/g, '\\)');
            var venueCount = sortedVenueCounts[i][1];
            $scope.venues[$scope.venues.length] = { value: optionValue, label: venueName };
            //  Swap line below with line above to include venue counts
            //  $scope.venues[$scope.venues.length] = { value: optionValue, label: venueName + ' (' + venueCount + ')' };

        }
    
    });
    
    
    //  Code to sort Music List View when user presses buttons on top of screen
    /*  Set the default sort order. (Same as when user presses the "Co/Date/Mx"
     *  Button  */
    $scope.orderByArg1 = 'company';
    $scope.orderByArg2 = 'dTake';
    $scope.orderByArg3 = 'absmatrix';
    
    
    /*  Based on the value of $scope.selectedCompany determine whether to
     *  display all takes or only those whose company value includes the string
     *  defined in $scope.selectedCompany   */
    $scope.selectedCompany = 'all';
	$scope.filterMusicCompanies = {value: 'all', label: 'All Companies'};
    $scope.limitCompanyTo = function(element) {
        if (! $scope.selectedCompany || $scope.selectedCompany == 'all') {
            return true;
        } else {
            return element.company.match($scope.selectedCompany) ? true : false;
        }
    };
    
    
    /*  Based on the value of $scope.selectedComposer determine whether to
     *  display all takes or only those whose composer value includes the string
     *  defined in $scope.selectedComposer   */
    $scope.selectedComposer = 'all';
	$scope.filterMusicComposers = {value: 'all', label: 'All Composers'};
    $scope.limitComposerTo = function(element) {
        if (! $scope.selectedComposer || $scope.selectedComposer == 'all') {
            return true;
        } else {
            return element.composer.match($scope.selectedComposer) ? true : false;
        }
    };
    
    
    /*  Based on the value of $scope.selectedVenue determine whether to
     *  display all takes or only those whose place value includes the string
     *  defined in $scope.selectedVenue   */
    $scope.selectedVenue = 'all';
	$scope.filterMusicVenues = {value: 'all', label: 'All Venues'};
    $scope.limitVenueTo = function(element) {
        if (! $scope.selectedVenue || $scope.selectedVenue == 'all') {
            return true;
        } else {
            return element.place.match($scope.selectedVenue) ? true : false;
        }
    };
    
    
    //  Code for Music List pagination by way of "Prev" and "Next" links
    /*  The "slice" filter below is placed on the ng-repeat directive used to
     *  build the list of artists.  It takes two arguments -- listOffset and
     *  listEnd -- to determine which slice of $scope.shellac to display.
     *  listOffset decides the starting index and listLength says how many
     *  elements from that point to travel.  listOffset is set to 0 below so
     *  that the default behavior is always to start at the beginning of
     *  $scope.shellac, and listLength is set to however many records you want
     *  to have displayed on screen at a time. */
    
    $scope.listOffset = 0;
    $scope.listLength = 40;
    $scope.listEnd = $scope.listOffset + $scope.listLength;
    
    /*  Increment listOffset and listEnd by + listLength causing the next
     *  listLength number of records to be displayed.   */
    $scope.pageForward = function() {
        /*  Uncomment line below if using "Prev" and "Next" buttons to 
         *  additional artist records as opposed to loading it in through
         *  infinite scrolling.  */
        // $scope.listOffset += $scope.listLength;
        $scope.listEnd += $scope.listLength;
    };

    
    /*  Increment listOffset and listEnd by - listLength causing the previous
     *  listLength number of records to be displayed.   */
    $scope.pageBack = function() {
        $scope.listOffset -= $scope.listLength;
        $scope.listEnd -= $scope.listLength;
    };
	
	
	/*	General purpose filter to automatically remove any records from
	 *	subsequent searches and filters based on universally true criteria.  */
    $scope.acmeFilter = function(element) {
        if (element.fExclude == 1) {
            return false;
        }
		return true;
    };
    
});


/** Artist Detail view controller */
app.controller('DetailCtrl', function ($scope, $routeParams, $location, fmangular) {

	// important to fetch valueLists before fetching the record, so the correct option is selected.
	// alternately, hard-code your value lists
    var filteredArtists = [];
    $scope.orderByField = $routeParams.obf;
    $scope.reverseSort = $routeParams.rs;
            
	fmangular.layout('Shellac', 'wla').then(function (layout) {
    	fmangular.findAll({'-db': 'Shellac', '-lay': 'wla'}).then(function (found) {
            
            //  Get all records in wla and set filters
            var allArtists = found;
            $scope.selectedNationality = $routeParams.sn;
            $scope.selectedRole = $routeParams.sr;

            //  Loop through records and extract those that match our filters            
            for (key in allArtists) {
                
                record = allArtists[key];
                
                //  Nationality Filter
                if (! $scope.selectedNationality || $scope.selectedNationality == 'all') {
                    if (record._fkArtistTypeId != 208 && record._fkArtistTypeId != 209) {
                        continue;
                    }
                } else if ($scope.selectedNationality == 'norwegian' && record._fkArtistTypeId != 208) {
                    continue;
                } else if ($scope.selectedNationality == 'foreign' && record._fkArtistTypeId != 209)  {
                    continue;
                }
                
                //  Role Filter
                if ($scope.selectedRole && $scope.selectedRole != 'all') {
					var roles = record.roles.split('\n');
					var matched = false;
					for (var i=0; i<= roles.length; i++) {
						if (roles[i] == $scope.selectedRole) {
							matched = true;
							break;
						}
					}
					if (! matched) {
						continue;
					}
                }
                
                filteredArtists[filteredArtists.length] = record;
                
            }
			
            
            //  Sort filteredArtists by orderByField
            if ($scope.orderByField == 'name') {
                filteredArtists.sort(function(a, b) {
                    a = a.name;
                    b = b.name;
                    return a < b ? -1 : (a > b ? 1 : 0);
                });
            } else if ($scope.orderByField == 'birth') {
                filteredArtists.sort(function(a, b) {
                    a = a.birth;
                    b = b.birth;
                    return a < b ? -1 : (a > b ? 1 : 0);
                });
            } else if ($scope.orderByField == 'death') {
                filteredArtists.sort(function(a, b) {
                    a = a.death;
                    b = b.death;
                    return a < b ? -1 : (a > b ? 1 : 0);
                });
            }
            
            
            //  Reverse the sort order if it was
            if ($scope.reverseSort == 'true') {
                filteredArtists.reverse();
            }
            
            
            //  Finally, get the IDs to use for Prev and Next
            $scope.prevArtistID = '';
            $scope.nextArtistID = '';
            for (var i=0; i<filteredArtists.length; i++) {
                if (filteredArtists[i].$recid == $routeParams.id) {
                    if (i > 0) {
                        $scope.prevArtistID = filteredArtists[i-1].$recid;
                    }
                    
                    if (i < filteredArtists.length) {
                        $scope.nextArtistID = filteredArtists[i+1].$recid;
                    }
                    break;
                }
            }
        });        
    });        


	fmangular.layout('Shellac', 'wad').then(function (layout) {
            $scope.valueLists = layout.valueLists;
        }).then(function() {
            return fmangular.find({'-db': 'Shellac', '-lay': 'wad', '-recid': $routeParams.id});
        }).then(function (found) {
            $scope.shellac = found[0];
        }, function (err) {
		alert('Could not locate this record: ' + err.message)
	});
    
    
    /*  Turn the Artist Detail links for PDFs, PNGs and MP3s on and off
     *  depending on the value of file.src in the associated Shellac record.  */
    $scope.showMediaLink = function(srcString, docType) {
        if (
            (srcString.match(/\.pdf/i) && docType === 'pdf') ||
            (srcString.match(/\.(png|gif|jpeg|jpg)/i) && docType === 'image') ||
            (srcString.match(/\.mp3/i) && docType === 'audio')
            ) {
            return true;
        } else {
            return false;
        }
    };
	
	
	/*	Given a string, try to determine whether it's just an HTML anchor tag
	 *	in the format: <a href="foo">faa</a>  If polarity is set to 'reversed'
	 *	return false when we have a match and true when we don't.  */
	$scope.isExternalResource = function(inputString, polarity) {
		if (inputString) {
			var returnTrue = (polarity == 'reversed') ? false : true;
			var returnFalse = (polarity == 'reversed') ? true : false;
			var rawString = String(inputString);
			rawString = rawString.replace(/^\s+/, '');
			rawString = rawString.replace(/(\s|\n\r)+$/, '');
			if (rawString.match(/^<a/i)) {
				return returnTrue;
			} else {
				return returnFalse;
			}
		} else {
			return false;
		}
	};
    
    
    /*  If there's another artist in this subset, show the Prev or Next n
     *  navigation link.  If not, don't.  */
    $scope.showHidePrevNext = function(artistID) {
        if (artistID) {
            return true;
        } else {
            return false;
        }
    };
	
	
    //  Code to sort Take Protal View when user presses buttons above portal.
    /*  Set the default sort order. (Same as when user presses the "Co/Date/Mx"
     *  Button  */
    $scope.orderByArg1 = 'company';
    $scope.orderByArg2 = 'dTake';
    $scope.orderByArg3 = 'absmatrix';
    
    
    /*  Simulate a link on div ng-click events.  */
    $scope.setLocation = function(targetURL) {
        window.location = targetURL;
    };
    
    
    /*  If the Artist has an image, display it, if not, don't.  */
    $scope.hasImage = function(imgSrc) {
        if (imgSrc.match(/image/)) {
            return true;
        } else {
            return false;
        }
    };
	
	
    //  Code for Take Portal pagination by way of "Prev" and "Next" links
    /*  The "slice" filter below is placed on the ng-repeat directive used to
     *  build the list of takes.  It takes two arguments -- listOffset and
     *  listEnd -- to determine which slice of $scope.shellac to display.
     *  listOffset decides the starting index and listLength says how many
     *  elements from that point to travel.  listOffset is set to 0 below so
     *  that the default behavior is always to start at the beginning of
     *  $scope.shellac, and listLength is set to however many records you want
     *  to have displayed on screen at a time. */
    
    $scope.listOffset = 0;
    $scope.listLength = 10;
    $scope.listEnd = $scope.listOffset + $scope.listLength;
    
    /*  Increment listOffset and listEnd by + listLength causing the next
     *  listLength number of records to be displayed.   */
    $scope.pageForward = function() {
        $scope.listOffset += $scope.listLength;
        $scope.listEnd += $scope.listLength;
    };

    
    /*  Increment listOffset and listEnd by - listLength causing the previous
     *  listLength number of records to be displayed.   */
    $scope.pageBack = function() {
        $scope.listOffset -= $scope.listLength;
        $scope.listEnd -= $scope.listLength;
    };
	
	
	/*	If we're not already displaying the first set of records in the takes
	 *	slice, show the "Previous Takes" link.  */
	$scope.showHidePrev = function() {
		if ($scope.listOffset > 0) {
			return true;
		} else {
			return false;
		}
	};
	
	
	/*	If we're not already displaying the last records in the takes slice,
	 *	show the "Next Takes" link.  */
	$scope.showHideNext = function(recordSetSize) {
		if ($scope.listEnd < recordSetSize) {
			return true;
		} else {
			return false;
		}
	};
	
});


/** Music Detail view controller */
app.controller('MusicDetailCtrl', function ($scope, $routeParams, $location, fmangular) {
    
    var filteredMusic = [];
    $scope.orderByFields = $routeParams.obf;

    var orderBy = ($routeParams.obf) ? $scope.orderByFields.split(',') : [];
    $scope.orderByArg1 = (orderBy[0]) ? orderBy[0] : '';
    $scope.orderByArg2 = (orderBy[1]) ? orderBy[1] : '';
    $scope.orderByArg3 = (orderBy[2]) ? orderBy[2] : '';
    
    var dateToNum = {
        'Jan': '01',
        'Feb': '02',
        'Mar': '03',
        'Apr': '04',
        'May': '05',
        'Jun': '06',
        'Jul': '07',
        'Aug': '08',
        'Sep': '09',
        'Oct': '10',
        'Nov': '11',
        'Dec': '12',
    };

	fmangular.layout('Shellac', 'wml').then(function (layout) {
    	fmangular.findAll({'-db': 'Shellac', '-lay': 'wml'}).then(function (found) {
            
            //  Get all records in wla and set filters
            var allMusic = found;
            $scope.selectedCompany = $routeParams.coy;
            $scope.selectedComposer = $routeParams.com;
            $scope.selectedVenue = $routeParams.ven;

            //  Loop through records and extract those that match our filters            
            for (key in allMusic) {
                
                record = allMusic[key];
                
                //  Company Filter
                if ($scope.selectedCompany && $scope.selectedCompany != 'all') {
                    if (! record.company.match($scope.selectedCompany)) {
                        continue;
                    }
                }
                
                //  Composer Filter
                if ($scope.selectedComposer && $scope.selectedComposer != 'all') {
                    if (! record.composer.match($scope.selectedComposer)) {
                        continue;
                    }
                }
                
                //  Venue Filter
                if ($scope.selectedVenue && $scope.selectedVenue != 'all') {
                    if (! record.place.match($scope.selectedVenue)) {
                        continue;
                    }
                }
                
                filteredMusic[filteredMusic.length] = record;
                
            }
            
            
            //  Sort filteredArtists by orderByField
            $scope.orderByFields = $scope.orderByFields.replace('/,$/', '');
            $scope.sortedOn = '';
            if ($scope.orderByFields == 'company,dTake,matrix') {
                $scope.sortedOn = $scope.orderByFields;
                filteredMusic.sort(function(a, b) {
                    var companyA = a.company;
                    var companyB = b.company;
                    var dTakeA = 0;
                    if (a.dTake) {
                        dTakeA = String(a.dTake);
                        var dateParts = dTakeA.split(' ');
                        var dmy = dateParts[3] + dateToNum[dateParts[1]] + dateParts[2];
                        dTakeA = parseInt(dmy);
                    }
                    var dTakeB = 0;
                    if (b.dTake) {
                        dTakeB = String(b.dTake);
                        var dateParts = dTakeB.split(' ');
                        var dmy = dateParts[3] + dateToNum[dateParts[1]] + dateParts[2];
                        dTakeB = parseInt(dmy);
                    }
                    var matrixA = a.matrix;
                    var matrixB = b.matrix;
                    
                    var cmp =
                        (companyA < companyB ? -1 : (companyA > companyB ? 1 : 0)) ||
                        (dTakeA < dTakeB ? -1 : (dTakeA > dTakeB ? 1 : 0)) ||
                        (matrixA < matrixB ? -1 : (matrixA > matrixB ? 1 : 0));
                    return cmp;
                    
                });
            } else if ($scope.orderByFields == 'company,matrix,dTake') {
                $scope.sortedOn = $scope.orderByFields;
                filteredMusic.sort(function(a, b) {
                    var companyA = a.company;
                    var companyB = b.company;
                    var matrixA = a.matrix;
                    var matrixB = b.matrix;
                    var dTakeA = 0;
                    if (a.dTake) {
                        dTakeA = String(a.dTake);
                        var dateParts = dTakeA.split(' ');
                        var dmy = dateParts[3] + dateToNum[dateParts[1]] + dateParts[2];
                        dTakeA = parseInt(dmy);
                    }
                    var dTakeB = 0;
                    if (b.dTake) {
                        dTakeB = String(b.dTake);
                        var dateParts = dTakeB.split(' ');
                        var dmy = dateParts[3] + dateToNum[dateParts[1]] + dateParts[2];
                        dTakeB = parseInt(dmy);
                    }
                    
                    var cmp =
                        (companyA < companyB ? -1 : (companyA > companyB ? 1 : 0)) ||
                        (matrixA < matrixB ? -1 : (matrixA > matrixB ? 1 : 0)) || 
                        (dTakeA < dTakeB ? -1 : (dTakeA > dTakeB ? 1 : 0));
                    return cmp;
                });
            } else if ($scope.orderByFields == 'dTake,matrix,') {
                $scope.sortedOn = $scope.orderByFields;
                filteredMusic.sort(function(a, b) {
                    var dTakeA = 0;
                    if (a.dTake) {
                        dTakeA = String(a.dTake);
                        var dateParts = dTakeA.split(' ');
                        var dmy = dateParts[3] + dateToNum[dateParts[1]] + dateParts[2];
                        dTakeA = parseInt(dmy);
                    }
                    var dTakeB = 0;
                    if (b.dTake) {
                        dTakeB = String(b.dTake);
                        var dateParts = dTakeB.split(' ');
                        var dmy = dateParts[3] + dateToNum[dateParts[1]] + dateParts[2];
                        dTakeB = parseInt(dmy);
                    }
                    var matrixA = a.matrix;
                    var matrixB = b.matrix;
                    
                    var cmp =
                        (dTakeA < dTakeB ? -1 : (dTakeA > dTakeB ? 1 : 0)) || 
                        (matrixA < matrixB ? -1 : (matrixA > matrixB ? 1 : 0)); 
                    return cmp;
                });
            } else if ($scope.orderByFields == 'composer,title,') {
                $scope.sortedOn = $scope.orderByFields + ' ct'; 
                filteredMusic.sort(function(a, b) {
                    var composerA = a.composer.toLowerCase();
                    var composerB = b.composer.toLowerCase();
                    var titleA = a.title.toLowerCase();
                    var titleB = b.title.toLowerCase();
                    
                    var cmp =
                        (composerA < composerB ? -1 : (composerA > composerB ? 1 : 0)) || 
                        (titleA < titleB ? -1 : (titleA > titleB ? 1 : 0)); 
                    return cmp;
                });
            }
            
            
            //  Finally, get the IDs to use for Prev and Next
            $scope.prevTakeID = '';
            $scope.nextTakeID = '';
            for (var i=0; i<filteredMusic.length; i++) {
                if (filteredMusic[i].$recid == $routeParams.id) {
                    if (i > 0) {
                        $scope.prevTakeID = filteredMusic[i-1].$recid;
                    }
                    
                    if (i < filteredMusic.length) {
                        $scope.nextTakeID = filteredMusic[i+1].$recid;
                    }
                    break;
                }
            }
        });        
    }); 
    

	fmangular.layout('Shellac', 'wdm').then(function (layout) {
            $scope.valueLists = layout.valueLists;
        }).then(function() {
            return fmangular.find({'-db': 'Shellac', '-lay': 'wdm', '-recid': $routeParams.id});
        }).then(function (found) {
            $scope.shellac = found[0];
        }, function (err) {
		alert('Could not locate this record: ' + err.message)
	});
    
    
    /*  Turn the Music Detail links for PDFs, PNGs and MP3s on and off
     *  depending on the value of file.src in the associated Shellac record.  */
    $scope.showMediaLink = function(srcString, docType) {
        if (
            (srcString.match(/\.pdf/i) && docType === 'pdf') ||
            (srcString.match(/\.(png|gif|jpg|jpeg)/i) && docType === 'image') ||
            (srcString.match(/\.mp3/i) && docType === 'audio')
            ) {
            return true;
        } else {
            return false;
        }
    };
    
    
    /*  If there's another take in this subset, show the Prev or Next n
     *  navigation link.  If not, don't.  */
    $scope.showHidePrevNext = function(takeID) {
        if (takeID) {
            return true;
        } else {
            return false;
        }
    };
    
});


/** Search view controller */
app.controller('SearchCtrl', function ($scope, fmangular, $location) {
    
	fmangular.findAll({'-db': 'Shellac', '-lay': 'wla'}).then(function (found) {
        
        //  All records in wla layout
        $scope.artists = found;
        
    });
    
    
    fmangular.findAll({'-db': 'Shellac', '-lay': 'wml'}).then(function (found) {
        
        //  All records in wla layout
        $scope.tracks = found;
        
    });
    
    
    $scope.queryArtistName = '';
    $scope.queryTrackTitle = '';
    $scope.queryStartYear = 0;
    $scope.queryEndYear = 0;
    $scope.orderByArg1 = 'company';
    $scope.orderByArg2 = 'dTake';
    $scope.orderByArg3 = 'matrix';
    $scope.displayArtistResults = false;
    $scope.displayTrackResults = false;
    
    
    $scope.searchArtists = function(artistName, trackTitle, startYear, endYear) {
        $scope.displayArtistResults = true;
        $scope.queryArtistName = artistName;
        $scope.queryTrackTitle = trackTitle;
        $scope.queryStartYear = startYear.replace(/[^0-9]/g, '');
        $scope.queryEndYear = endYear.replace(/[^0-9]/g, '');
    };
    
    
    $scope.searchTakes = function(artistName, trackTitle, startYear, endYear) {
        document.getElementById('sort_buttons').style.visibility = 'visible';
        $scope.displayTrackResults = true;
        $scope.queryArtistName = artistName;
        $scope.queryTrackTitle = trackTitle;
        $scope.queryStartYear = startYear.replace(/[^0-9]/g, '');
        $scope.queryEndYear = endYear.replace(/[^0-9]/g, '');
    };
    
    
    $scope.clearFields = function() {
        document.getElementById('artist_name').value = '';
        document.getElementById('track_title').value = '';
        document.getElementById('start_year').value = '';
        document.getElementById('end_year').value = '';
        document.getElementById('sort_buttons').style.visibility = 'hidden';
        
        $scope.queryArtistName = '';
        $scope.queryTrackTitle = '';
        $scope.queryStartYear = '';
        $scope.queryEndYear = '';
        
        $scope.orderByArg1 = 'company';
        $scope.orderByArg2 = 'dTake';
        $scope.orderByArg3 = 'matrix';
        
        $scope.displayArtistResults = false;
        $scope.displayTrackResults = false;
    };
    
    
    $scope.artistQuery = function(element) {
        
        //  Nothing has been entered into the form -- default state
        if (! $scope.queryArtistName && ! $scope.queryTrackTitle && $scope.queryStartYear == 0 && $scope.queryEndYear == 0) {
            return false;
        }
        
        //  Match on Composer Name field
        var artistRe = new RegExp($scope.queryArtistName, 'i');
        if ($scope.queryArtistName  && ! element.allnames.match(artistRe)) {
            return false;
        }
        
        //  Match on Title field
        var titleRe = new RegExp($scope.queryTrackTitle, 'i');
        if ($scope.queryTrackTitle  && ! element.titles.match(titleRe)) {
            return false;
        }
        
        //  Match on date range
        if ($scope.queryStartYear && $scope.queryEndYear) {
            if ($scope.queryStartYear > element.lastrecording || $scope.queryEndYear < element.firstrecording) {
                return false;
            }
        }
        
        return true;
        
    };
    
    
    $scope.trackQuery = function(element) {

        //  Nothing has been entered into the form -- default state
        if (! $scope.queryArtistName && ! $scope.queryTrackTitle && $scope.queryStartYear == 0 && $scope.queryEndYear == 0) {
            return false;
        }
        
        //  Match on Composer Name field
        var artistRe = new RegExp($scope.queryArtistName, 'i');
        if ($scope.queryArtistName  && ! element.artists.match(artistRe)) {
            return false;
        }
        
        //  Match on Title field
        var titleRe = new RegExp($scope.queryTrackTitle, 'i');
        if ($scope.queryTrackTitle  && ! element.titles.match(titleRe)) {
            return false;
        }
        
        //  Match on date range
        if ($scope.queryStartYear && $scope.queryEndYear) {
            if ($scope.queryStartYear > element.year || $scope.queryEndYear < element.year) {
                return false;
            }
        }
        
        return true;
    
    };
    
    
    //  Code to sort Artist List by column heading
    /*  Default to an ascending sort on the "name" column and initialize
     *  $scope.lastColClicked   */
    $scope.orderByField = 'name';   
    $scope.reverseSort = false;
    $scope.lastColClicked = $scope.orderByField;
    
    /*  setReverseSort() is bound to ng-click on column headers.  If the user
     *  just clicked on a new column, set the reverse order to match
     *  initialSortOrder.  Otherwise, if we're currently in a descending sort,
     *  return an ascending sort and vice versa.  */
    $scope.setReverseSort = function(clickedCol, initialSortOrder, curReverseSort) {
        var returnVal;
        if ($scope.lastColClicked != clickedCol) {
            returnVal = (initialSortOrder == 'asc') ? false : true;
            $scope.lastColClicked = clickedCol;
        } else {
            returnVal = (curReverseSort) ? false : true;
        }
        return returnVal;
    };
    
	
	/*	General purpose filter to automatically remove any records from
	 *	subsequent searches and filters based on universally true criteria.  */
    $scope.acmeFilter = function(element) {
        if (element.fExclude == 1) {
            return false;
        }
		return true;
    };
    
});


/*  Custom filter to, given an array, starting index and ending index, return
 *  just the slice of the array between the starting index and ending index.  */
app.filter('slice', function() {
    return function(arr, start, end) {
        if (arr) {
            return arr.slice(start, end);
        }
    };
});


/*  Custom filter to, given a date string in FileMaker's date format, convert
 *  it to day.month.year  */
app.filter('formatFMDate', function($filter) {
    return function(fmDate) {
        if (fmDate) {
            fmDate = String(fmDate);
            var dateParts = fmDate.split(' ');
            var dmy = dateParts[2] + ' ' + dateParts[1] + ' ' + dateParts[3];
            return dmy;
        } else {
            return '';
        }
    };
});


/*  Custom filter to try to extral the target URL out of a string in the
 *	the format '<a href="foo">faa</a>'  */
app.filter('extractLinkURL', function($filter) {
    return function(inputString) {
        if (inputString) {
			var matches = inputString.match(/href=?"([^"]+)"/i);
			if (matches) {
				return matches[1];
			} else {
				return '';
			}
        } else {
            return '';
        }
    };
});
	

///*  Custom filter to try to extral the link label out of a string in the
// *	the format '<a href="foo">faa</a>'  */
app.filter('extractLinkLabel', function($filter) {
    return function(inputString) {
        if (inputString) {
			var matches = inputString.match(/<a[^>]+>([^<]+)</i);
			if (matches) {
				return matches[1];
			} else {
				return '';
			}
        } else {
            return '';
        }
    };
});

