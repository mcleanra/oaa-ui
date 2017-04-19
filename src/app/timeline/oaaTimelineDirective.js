angular.module('oaa.ui')
    .directive('oaaTimeline', ['moment', '_', 'prioritiesService', 'oaaTypesService', '$uibModal', '$timeout',
        function(moment, _, prioritiesService, oaaTypesService, $uibModal, $timeout) {
            return {
                restrict: 'E',
                scope: {

                    //an array of oaas
                    oaaList: '=',

                    //the start date of the fiscal year
                    fyStart: '=',

                    //the end date of the fiscal year
                    fyEnd: '=',

                    //true or false
                    showLegend: '=',

                    //string, either 'country' or 'priority'
                    sortBy: '=',

                    //optional: an array of values to limit the y-axis to.  i.e. ['Bulgaria', 'Germany']
                    sortByFilter: '='
                },
                templateUrl: 'app/oaa/ui/timeline/oaaTimeline.html',
                link: {
                    pre: function(scope, elem, attrs) {

                        var boundaries = [];

                        scope.print = print;

                        scope.$watch('oaaList', function(newValue, oldValue) {

                            scope.oaas = newValue;
                            render();

                        }, false);

                        /*************************************************************/
                        // Legend
                        /*************************************************************/
                        scope.truncated = true;
                        scope.doActionForOaa = doActionForOaa;

                        //set up the theme for the chart
                        function applyTheme() {

                            Highcharts.theme = {
                                chart: {
                                    backgroundColor: '#FFFFFF'
                                },
                                title: {
                                    style: {
                                        color: 'gray'
                                        //font: 'bold 16px "Trebuchet MS", Verdana, sans-serif'
                                    }
                                },
                                subtitle: {
                                    style: {
                                        color: 'gray'
                                        //font: 'bold 12px "Trebuchet MS", Verdana, sans-serif'
                                    }
                                },
                                legend: {
                                    itemStyle: {
                                        font: '11pt "Calibri", Verdana, sans-serif',
                                        color: '#333'
                                    },
                                    itemHoverStyle: {
                                        color: 'gray'
                                    }
                                }
                            };
                            Highcharts.setOptions(Highcharts.theme);
                        }

                        //items in oaa dropdown menus lead here
                        function doActionForOaa(action, oaa, $event) {
                            switch (action) {
                                case 'view-staffing':
                                    window.open("#/staffingTool/oaa/" + oaa.Id, "_blank");
                                    break;
                                case 'view-checklist':
                                    openCheckListDialog(oaa);
                                    break;
                                case 'view-oaa':
                                    window.open("#/eventDetails/" + oaa.Event_x003a_OAA_x0020_Type.split(';#')[0] + "/" + oaa.Id, "_blank");
                                    break;
                                case 'view-documents':
                                    openMissionProductsDialog(oaa);
                                    break;
                                default:
                            }
                            $event.preventDefault();
                            //$event.stopPropagation();
                            return false;
                        }

                        function openCheckListDialog(oaa) {
                            var modalInstance = $uibModal.open({

                                templateUrl: 'StaffingTool/CheckListItemModal/checkListItemModal.html',
                                controller: 'StaffingCheckListModalCtrl',
                                resolve: {
                                    staffingItem: {
                                        oaaID: oaa.ID
                                    }
                                }
                            });
                        }

                        function openMissionProductsDialog(oaa) {
                            var modalDlg = $uibModal.open({
                                //backdrop: 'static',
                                //size: 'lg',
                                windowClass: 'wide-modal',
                                controller: 'missionProductsModalController',
                                templateUrl: 'MissionProducts/missionProductsModal/missionProductsModal.html',
                                resolve: {
                                    arrayOfOaaIds: function() {
                                        return [oaa.ID];
                                    },
                                    arrayOfMissionProducts: null
                                }
                            });
                        }
                        /*************************************************************/
                        // End legend
                        /*************************************************************/

                        /*************************************************************/
                        // Chart
                        /*************************************************************/

                        //main settings to use for the chart
                        scope.chart = {
                            series: [],
                            title: 'Chart',
                            alignTicks: false,
                            navigation: {
                                buttonOptions: {
                                    theme: {
                                        style: {
                                            color: '#039',
                                            textDecoration: 'underline'
                                        }
                                    }
                                }
                            },
                            events: {
                                load: function(event) {
                                    this.showLoading();
                                }
                            },
                            loading: {
                                labelStyle: {
                                    top: '45%',
                                    display: 'block',
                                    backgroundColor: '#ddd'
                                }
                            },
                            options: {
                                xAxis: [{ //bottom axis with the months
                                    type: 'datetime',
                                    // title: {
                                    //     text: 'Date'
                                    // },
                                    labels: {
                                        style: {
                                            'color': 'gray'
                                        }
                                    },
                                    minPadding: 0,
                                    maxPadding: 0
                                }, { //top static axis for the quarters
                                    type: 'datetime',
                                    title: {
                                        //text: 'Quarter'
                                    },
                                    labels: {
                                        style: {
                                            'color': 'gray'
                                        },
                                        formatter: function() {
                                            var label = "";
                                            var d = new Date(this.value);
                                            var q = Math.floor((d.getMonth() + 3) / 3);
                                            label = "Q" + ((q % 4) + 1);
                                            return label;
                                        },
                                        x: 150
                                    },
                                    tickInterval: 3 * 30 * 24 * 3600 * 1000, //every 3 months
                                    opposite: true,
                                    gridLineWidth: 1
                                }
                                ],
                                yAxis: [{ //This axis is up next to the chart
                                    plotBands: [],
                                    plotLines: [],
                                    //min: 0,
                                    //max: 100,
                                    visible: false,
                                    title: {
                                        text: ''
                                    },
                                    labels: {
                                        enabled: false
                                    },
                                    tickColor: 'gray',
                                    tickWidth: 1,
                                    tickLength: 20,
                                    gridLineWidth: 0,
                                    minPadding: 0.1,
                                    maxPadding: 0.05,
                                    offset: 0
                                }, 
								// { //This axis is offset to the left (offset is in px).  This offset creates the space for the labels on the plotbands
                                //     title: {
                                //         text: ''
                                //     },
                                //     offset: 110
                                // }, 
								{ //This is the axis on the right side
                                    title: {
                                        text: ''
                                    },
                                    opposite: true,
                                    lineWidth: 1
                                }
                                ],
                                legend: {
                                    //enabled: false,

                                    labelFormatter: function() {
                                        return this.userOptions.typeName;
                                    }

                                },
                                tooltip: {
                                    enabled: false

                                    //this is handy for debugging specific points on the chart
									/*
									enabled: true,
									formatter: function(){
									return 	'<b>' + this.series.name + '</b><br/>' +
									'<span>' + this.point.options.group_name + '</span><br/>' +
									'<span>' + moment(this.point.options.from).format("MM/DD") + ' - ' + moment(this.point.options.to).format("MM/DD") + '</span>';
									}
									*/
                                },
                                plotOptions: {
                                    column: {
                                        stacking: 'percent',
                                        dataLabels: {
                                            enabled: false
                                        }
                                    },
                                    point: {},
                                    line: {
                                        lineWidth: 20,
                                        linecap: 'square',
                                        stacking: null,
                                        getExtremesFromAll: true,
                                        cursor: 'pointer',
                                        marker: {
                                            enabled: false,
                                            states: {
                                                hover: {
                                                    enabled: false
                                                }
                                            }
                                        },
                                        dataLabels: {
                                            enabled: true,
                                            align: 'center',
                                            verticalAlign: 'middle',
                                            useHTML: true,
                                            formatter: function() {
                                                return this.point.options && this.point.options.label;
                                            }
                                        },
                                        events: {
                                            legendItemClick: function() {
                                                //toggleItemsByColor(this.color);
                                                return false; //cancel the default action (hiding this event)
                                            },
                                            click: function() {
                                                window.open("/OAA/app/Index.html#/eventDetails/" + this.data[0].eventId + "/" + this.data[0].oaaId, "_blank");
                                            }
                                        }
                                    }
                                },
                                series: {
                                    pointPadding: 2,
                                    groupPadding: 2,
                                    pointWidth: 2
                                }
                            }
                        };

                        //adds something to the legend if its not already in there
                        function addToLegend(name, color) {
                            var existingItem = _.findWhere(scope.legend, {
                                name: name
                            });

                            if (existingItem == undefined) {
                                scope.legend.push({
                                    name: name,
                                    color: color
                                });
                            }
                        }

                        function clearPlotLines() {
                            //y-axis
                            var plotLines = getChart().yAxis[0].options.plotLines;
                            for (var i = plotLines.length; i > 0; i--) {
                                try {
                                    getChart().yAxis[0].removePlotLine(plotLines[0].id);
                                } catch (e) {
                                    console.log("clearPlotLines() exception");
                                }
                            }
                        }

                        function clearPlotBands() {
                            //y-axis
                            var plotBands = getChart().yAxis[0].options.plotBands;
                            for (var i = plotBands.length; i > 0; i--) {
                                try {
                                    getChart().yAxis[0].removePlotBand(plotBands[0].id);
                                } catch (e) {
                                    console.log("clearPlotBands() exception");
                                }
                            }
                        }

                        //the series is originally plotted with one event per y value.
                        //this combines multiple events onto the same lines where there is white space available.  returns the "optimized" series
                        function collapse_y_axis(series) {

                            //returns true if there is another event already occupying the start/end on this Y line
                            var collision = function(item, y) {
                                var min_dist = 5;
                                var start = item.data[0].x;
                                var end = item.data[1].x;
                                var length = series.length;
                                for (var i = 0; i < length; i++) {
                                    var currItem = series[i];

                                    //an event can never collide with itself
                                    if (item == currItem)
                                        return false;

                                    //currItem has a start an end point
                                    if (!!currItem.data[0] && !!currItem.data[1]) {
                                        //currItem is on the axis we want to look at
                                        if (currItem.data[0].y == y) {
                                            //the currItem on the graph has a start point/end point that lies between the start/end of the one we're trying to place
                                            if (moment(currItem.data[0].x).isBetween(moment(start), moment(end)))
                                                return true;
                                            if (moment(currItem.data[1].x).isBetween(moment(start), moment(end)))
                                                return true;
                                            //our currItem has a start or end point between the start/end of the one that's already on the graph
                                            if (moment(start).isBetween(moment(currItem.data[0].x), moment(currItem.data[1].x)))
                                                return true;
                                            if (moment(end).isBetween(moment(currItem.data[0].x), moment(currItem.data[1].x)))
                                                return true;
                                            //either the start or end points are too close
                                            if (Math.abs(moment(currItem.data[0].x).diff(moment(start), 'days')) < min_dist)
                                                return true;
                                            if (Math.abs(moment(currItem.data[1].x).diff(moment(start), 'days')) < min_dist)
                                                return true;
                                            if (Math.abs(moment(currItem.data[0].x).diff(moment(end), 'days')) < min_dist)
                                                return true;
                                            if (Math.abs(moment(currItem.data[1].x).diff(moment(end), 'days')) < min_dist)
                                                return true;
                                            //collides at start/end points
                                            if (currItem.data[0].starts_outside && item.data[0].starts_outside)
                                                return true;
                                            if (currItem.data[0].ends_outside && item.data[0].ends_outside)
                                                return true;
                                        }
                                    }
                                }
                                //the space is available
                                return false;
                            };

                            //find the lowest available Y value where this event will fit on the chart
                            var find_lowest_available_y = function(item) {
                                var lowest_allowed_y = 1;
                                var start = item.data[0].x;
                                var end = item.data[1].x;

                                for (var i = 0; i < series.length; i++) {
                                    if (i >= lowest_allowed_y
                                        && group_ok(item.data[0].group_name, i) //grouped with like priorities if placed on this line
                                        && !collision(item, i)) { //doesn't collide with another item
                                        return i;
                                    }
                                }
                                return item.data[0].y + 1; //this means we couldn't find a spot for it!!  shouldn't ever happen
                            };

                            //looks at all the items on a Y line and return false if one doesn't match the group
                            var group_ok = function(group_name, y) {
                                for (var i = 0; i < series.length; i++) {
                                    var item = series[i];
                                    //item is on the axis we want to look at
                                    if (item.data[0].y == y) {
                                        //there's an item on this axis that doesn't match our group
                                        if (item.data[0].group_name != group_name) {
                                            return false;
                                        }
                                    }
                                }
                                //item would be grouped correctly on this y value
                                return true;
                            };

                            var dataMax = 0;

                            //iterate through the series and optimize for space
                            for (var i = 0; i < series.length; i++) {
                                var item = series[i];
                                var y = find_lowest_available_y(item);
                                if (y > dataMax)
                                    dataMax = y;
                                set_y(item, y);
                            }

                            //scaleDataUp(series, 100, dataMax);

                            return series;
                        }

                        //TODO: gets the correct instance of highcharts from the page in case there are multiple.
                        function getChart() {
                            if (!Highcharts.charts || Highcharts.charts.length == 0) {
                                console.log("Highcharts didn't load.");
                            }
                            return Highcharts.charts[Highcharts.charts.length - 1];
                        }

                        //looks up the appropriate color and type information for an OAA.
                        //tries to use the color for the type.  falls back to the type category/color if necessary.  uses grey if none of those are available
                        function getOaaTypeNameAndColor(oaa) {
                            var name = oaa.Event_x003a_OAA_x0020_Type.split(';#')[1];
                            var color = "#808080"; //grey

                            var oaaType = _.findWhere(scope.oaaTypes, {
                                Title: name
                            });

                            if (oaaType == undefined) {
                                name = "Obsolete OAA Type";
                            } else {
                                name = oaaType.Enumerated;
                                if (!!oaaType.OAATypeCategory) {
                                    color = oaaType.OAATypeCategory.Color;
                                    name = oaaType.OAATypeCategory.Title;
                                }

                                //type has its own special color, so override using that one
                                if (oaaType.color != null && oaaType.color != "") {
                                    color = oaaType.color;
                                    name = oaaType.Enumerated;
                                }
                            }

                            if (!color || color == undefined)
                                color = "#808080"; //grey

                            return {
                                name: name,
                                color: color
                            };
                        }

                        //get the previously fetched color to use for a plot band (for priority grouping)
                        function getColorForPriority(priority) {
                            var p = _.findWhere(scope.priorities, {
                                Title: priority
                            });
                            if (p == undefined)
                                return "#808080"; //grey
                            return p.Color;
                        }

                        //converts the raw OAA data into a plottable series for highcharts
                        function getSeries(fy_start, fy_end) {
                            var series = [];


                            //filter out any items that are considered invalid -- block of code added 2-16-2017 - JDB
                            scope.oaas = _.reject(scope.oaas, function(item) {

                                var start_date = moment(item.Start_x0020_Date);
                                var end_date = moment(item.End_x0020_Date);
                                var invalid_event = moment(end_date).isBefore(fy_start) || moment(start_date).isAfter(fy_end);
                                return invalid_event;

                            });


                            _.each(scope.oaas, function(oaa, i) {

                                if (typeof oaa != 'undefined') {

                                    var oaaTypeAbbreviation = oaa.Event_x003a_OAA_x0020_Type.split(';#')[1] || "UNK";

                                    //12 days seems to be the magic number for fitting a 5 letter label
                                    var min_length = 17;

                                    var start_date = moment(oaa.Start_x0020_Date);
                                    var end_date = moment(oaa.End_x0020_Date);

                                    //in case the server returns something that shouldn't be plotted
                                    var invalid_event = moment(end_date).isBefore(fy_start) || moment(start_date).isAfter(fy_end);

                                    var event_length = moment(end_date).diff(moment(start_date), 'days');
                                    var visible_start = start_date.isBefore(fy_start) ? fy_start : start_date;
                                    var visible_end = end_date.isAfter(fy_end) ? fy_end : end_date;
                                    var visible_event_length = moment(visible_end).diff(moment(visible_start), 'days');

                                    //this event is shorter than the minimum length
                                    if (visible_event_length < min_length) {
                                        if (moment(visible_start).isSame(moment(fy_start), 'day')) { //it starts outside the chart
                                            visible_event_length = 5;
                                        } else if (moment(visible_end).isSame(moment(fy_end), 'day')) { //it ends outside the chart
                                            visible_event_length = 5;
                                        } else { //its a normal item, just short
                                            //move the start and end points left/right enough to make it meet the min_length
                                            visible_start = moment(visible_start).add(- (min_length - visible_event_length) / 2, 'days');
                                            visible_end = moment(visible_end).add((min_length - visible_event_length) / 2, 'days');
                                            visible_event_length = min_length;
                                        }
                                    }
                                    var starts_outside = visible_start == fy_start;
                                    var ends_outside = visible_end == fy_end;
                                    var oaaType = getOaaTypeNameAndColor(oaa);
                                    var midpoint = moment(visible_start).add(visible_event_length / 2, 'days');
                                    var priority = oaa.Priority;
                                    var eventId = oaa.Event_x003a_OAA_x0020_Type.split(';#')[0];
                                    var color = oaaType.color;
                                    var status_class = oaa.Status ? "status-" + oaa.Status.toLowerCase() : "status-none";

									var index = oaa.Index || (i + 1);

                                    //var legend_number = '<span class="legend-number ' + status_class + '" title="' + oaa.EventID + '" style="cursor:pointer;">' + index + '</span>';

									var legend_number = '';

                                    var label = '<span title="' + oaa.EventID + '" class="data-label" style="color:' + getTextColorForBackground(color) + '" style="cursor:pointer;">&nbsp;' + oaaTypeAbbreviation.substring(0, 5) + '</span>';
                                    var group_name = oaa.Group || '';
                                    var exists_in_legend = _.findWhere(scope.legend, {
                                        name: oaaType.name
                                    }) != undefined;
                                    var item = {
                                        name: oaa.EventID,
                                        color: color,
                                        className: status_class,
                                        showInLegend: !exists_in_legend,
                                        typeName: oaaType.name,
                                        data: [{ //start date
                                            x: visible_start,
                                            y: i,
                                            index: i,
                                            from: start_date,
                                            to: end_date,
                                            priority: priority,
                                            eventId: eventId,
                                            oaaId: oaa.Id,
                                            starts_outside: starts_outside,
                                            ends_outside: ends_outside,
                                            group_name: group_name
                                        }, { //end date
                                            x: visible_end,
                                            y: i,
                                            index: i,
                                            from: start_date,
                                            to: end_date,
                                            priority: priority
                                        }, { //midpoint
                                            x: midpoint,
                                            y: i,
                                            label: visible_event_length < min_length ? legend_number : legend_number + label,
                                            index: i,
                                            from: start_date,
                                            to: end_date,
                                            priority: priority
                                        }
                                        ]
                                    };

                                    if (invalid_event) {
                                        scope.oaas.splice(i, 1);
                                    } else {
                                        addToLegend(oaaType.name, color);
                                        series.push(item);
                                    }

                                }
                                else {
                                }

                            });
                            return series;
                        }

                        //decides whether text should be black or white for a given background color
                        function getTextColorForBackground(hexColor) {
                            var rgb = hexToRgb(hexColor);
                            if (rgb == null)
                                return "#000000";
                            var luminosity = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
                            if (luminosity > 179) {
                                return "#000000";
                            } else
                                return "#FFFFFF";
                        }

                        //converts a hex color value to its rgb components
                        function hexToRgb(hex) {
                            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                            return result ? {
                                r: parseInt(result[1], 16),
                                g: parseInt(result[2], 16),
                                b: parseInt(result[3], 16)
                            }
                                : null;
                        }

                        //hides series items when legend is clicked
                        function toggleItemsByColor(color) {
                            var series = scope.chart.series;
                            for (var i = 0; i < series.length; i++) {
                                if (series[i].color == color) {
                                    series[i].setVisible(!series[i].visible, false);
                                }
                            }
                        }

                        //entry point
                        function initialize() {
                            scope.legend = [];
                            scope.oaaTypes = [];
                            scope.yearFilter = moment(scope.fyEnd).year() || moment().year();

                            if (typeof scope.sortBy == 'undefined') scope.sortBy = 'priority';

                            //populate the list of priorities which will be used in the chart
                            prioritiesService.get()
                                .then(function(priorities) {
                                    scope.priorities = priorities;
                                });

                            applyTheme();

                            //get a list of oaa types and colors to use in the chart
                            oaaTypesService.executeRestQuery(null, "*,OAATypeCategory/Id,OAATypeCategory/Title,OAATypeCategory/Color,OAATypeCategory/SortOrder", null, "OAATypeCategory")
                                .then(function(types) {
                                    scope.oaaTypes = types;
                                    render();
                                });
                        }

                        //adds a plot line for each boundary on the y-axis (the sortBy groups)
                        function plotBoundaries() {
                            var ticks = [];
                            var yAxis = getChart().yAxis[0];
                            var series = scope.chart.series;

                            clearPlotBands();
                            clearPlotLines();
                            boundaries = [];

                            var len = series.length;
                            //iterate series and find the group boundaries
                            for (var i = 0; i < series.length; i++) {
                                var item = series[i];
                                updateBoundaries(item.data[0].y, item.data[0].group_name);
                            }

                            //iterate boundaries and add plot bands
                            len = boundaries.length;
                            for (var i = 0; i < len; i++) {
                                var highest = boundaries[i].highest;
                                var lowest = boundaries[i].lowest;

                                //put a line between each grouping
                                if (len > i + 1) {
                                    var nextBoundary = boundaries[i + 1].lowest;
                                    var plotLineLoc = highest + ((nextBoundary - highest) / 2);
                                    yAxis.addPlotLine({
                                        id: plotLineLoc + '_' + moment(),
                                        color: 'gray',
                                        width: 1,
                                        value: plotLineLoc,
                                        zIndex: 4
                                    });
                                }

                                //add a plotband that's invisible except for the label out to the left
                                yAxis.addPlotBand({
                                    id: boundaries[i].label + '_' + moment(),
                                    color: '',
                                    //borderWidth: 1,
                                    //borderColor: 'red',
                                    from: lowest - 1,
                                    to: highest + 1,
                                    label: {
                                        text: scope.sortBy == 'country' ? '<div class="plotband-label"><span><a href="#/country/' + boundaries[i].label + '/engagements">' + boundaries[i].label + '</a></span></div>' : '<div class="plotband-label"><span>' + boundaries[i].label + '</span></div>',
                                        align: 'left',
                                        useHTML: true
                                    }
                                });
                            }
                        }

                        //assigns a group to each oaa.  duplicates oaas into each group if they have need to be displayed more than once.
                        function groupOaas() {
							
                            _.each(scope.oaas, function(oaa, index) {

                                //this oaa already has a group, so don't dupe it again
                                if (oaa.Group) return;

                                var sortByValues = [];
                                if (scope.sortBy == 'country') {
                                    sortByValues = oaa.Country_x003a_Title.split(';#');
                                }
                                else {
                                    sortByValues = oaa.Event_x003a_Priority.split(';#');
                                }

                                //if we determine that the group is 'None', this OAA doesn't get duped.  it goes into the none column and we go on to the next oaa
                                if (sortByValues.length <= 1) {
                                    oaa.Group = "None";
                                    oaa.Index = index + 1;
                                    return;
                                }

                                //an oaa can have more than one country/priority.  for each one, duplicate the oaa so that it will be shown multiple times
                                _.each(sortByValues, function(value) {
                                    //skip the garbage data
                                    if ($.isNumeric(value) || value == '' || value == ';') return;

                                    //dirty data; sometimes priorities have an extra ;
                                    value = value.replace(';', '');

                                    var copy = angular.copy(oaa);

                                    //this is the value on the y-axis that this oaa will be shown under
                                    copy.Group = value;

                                    //this is the legend number that will be displayed by the item
                                    copy.Index = index + 1;

                                    //the sortByFilter allows you to specify what should be shown on the Y axis
                                    if (!scope.sortByFilter || scope.sortByFilter.length == 0 || scope.sortByFilter.indexOf(value) != -1) {
                                        scope.oaas.push(copy);
                                    }
                                });
                            });

                            //the originals that were copied from are still there.  filter them out (they don't have a group)
                            scope.oaas = _.filter(scope.oaas, function(oaa) {
                                return (typeof oaa.Group != 'undefined');
                            });

                            scope.oaas = _.sortBy(scope.oaas, "Group").reverse();
                        }

                        //resize the chart and print, then set the size back
                        function print() {
                            window.print();
                        }

                        //check for oaa data and try to render it on the chart
                        function render() {

                            scope.legend = [];
                            var start = scope.fyStart;
                            var end = scope.fyEnd;

                            //groupOaas();

                            var series = getSeries(start, end);

                            scope.oaas = scope.oaas.reverse();
                            var collapsed = collapse_y_axis(series);

                            //put the series into the chart
                            scope.chart.series = collapsed;

                            //lock the month axis to match the specified FY
                            getChart().xAxis[0].setExtremes(start, end, true, true);
                            getChart().xAxis[1].setExtremes(start, end, true, true);

                            if (scope.oaas.length > 0) {
                                //add a red line that represents today
                                getChart().xAxis[0].addPlotLine({
                                    id: 'today',
                                    color: 'red',
                                    width: 1,
                                    value: moment()
                                });
                            }

                            setTimeout(function() {

                                //adjust the chart height based on how many items we have to display
                                var lineWidth = 20;
                                var y = getChart().yAxis[0].getExtremes();
                                var chartHeight = (y.dataMax * lineWidth) * 2;
                                chartHeight = chartHeight < 500 ? 500 : chartHeight;
                                getChart().setSize(null, chartHeight);

                                //do this after the resize or the lines will be in the wrong spot
                                plotBoundaries();
                                getChart().hideLoading();

                            }, 1000);
                        }

                        //the boundaries between the sortBy groups (i.e. priority) are kept in this array so we can plot the lines and labels after the chart renders
                        function updateBoundaries(y, groupName) {
                            var boundary = _.findWhere(boundaries, {
                                label: groupName
                            });

                            if (!boundary) {
                                boundaries.push({
                                    highest: y,
                                    lowest: y,
                                    label: groupName
                                });
                            } else {
                                if (y >= boundary.highest)
                                    boundary.highest = y;
                                if (y <= boundary.lowest)
                                    boundary.lowest = y;
                            }
                        }

                        //move the event to the given spot on the chart
                        function set_y(item, y) {
                            item.data[0].y = y;
                            item.data[1].y = y;
                            item.data[2].y = y;
                        }

                        initialize();
                    } //pre func
                } //link
            }
        }
    ]);
