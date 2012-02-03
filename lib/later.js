/**
* Later.js 0.0.1
* (c) 2012 Bill, BunKat LLC.
* Later is freely distributable under the MIT license.
* For all details and documentation:
*     http://bunkat.github.com/later
*/
(function() {

  	/**
   	* Calculates the next occurrence (or occcurrences) of a given schedule.
   	* Schedules are simply a set of constraints that must be met for a 
   	* particular date to be valid. Schedules can be generated using Recur or
   	* can be created directly.  
   	*
   	* Schedules have the following form:
   	*
   	* {
   	*	schedules: [
   	*		{
   	*			constraintId: [valid values],
   	*			constraintId: [valid values],
   	*			...
   	*		},
   	*		{
   	*			constraintId: [valid values],
   	*			constraintId: [valid values],
   	*			...
   	*		}
   	*		...
   	*	],
   	*	exceptions: [
   	*		{
   	*			constraintId: [valid values],
   	*			constraintId: [valid values],
   	*			...			
   	*		},
   	*		{
   	*			constraintId: [valid values],
   	*			constraintId: [valid values],
   	*			...			
   	*		},
   	*		...
   	*	]	
   	* }
   	*
   	* See Recur.js for the available constraints and their value ranges.
   	*/

	/**
   	* Initializes the Later object. 
   	*
   	* @param {Int} resolution: Minimum number of seconds between occurrences
   	* @param {Bool} useLocalTime: True if local time zone should be used
   	* @api public
   	*/
	var Later = function(resolution, useLocalTime) {

		var isLocal = useLocalTime || false
		  , get = 'get' + (isLocal ? '' : 'UTC')

		  // minimum time between valid occurrences in seconds
		  , resolution = resolution || 1
		  
		  // constants
		  , DAY = 86400000

		  // aliases for common math functions
		  , ceil = Math.ceil		
		  , floor = Math.floor

		  // data prototypes to switch between UTC and local time calculations
		  , dateProto = Date.prototype
		  , getYear = dateProto[get + 'FullYear']
		  , getMonth = dateProto[get + 'Month']
		  , getDate = dateProto[get + 'Date']
		  , getDay = dateProto[get + 'Day']
		  , getHour = dateProto[get + 'Hours']
		  , getMin = dateProto[get + 'Minutes']
		  , getSec = dateProto[get + 'Seconds'];

		/**
	   	* Calculates the next valid occurrence of a particular schedule that 
	   	* occurs on or after the specified start time. 
	   	*
	   	* @param {object} schedule: Valid schedule object containing constraints
	   	* @param {Date} start: The first possible valid occurrence
	   	*/
		var getNextForSchedule = function(sched, start) {
			var next = start, inc, x, cur
			  , Y, M, D, d, h, m, s
			  , oJan1, oMonthStart, oWeekStart, oWeekStartY, oMonthEnd
			  , oDec31
			  , t, dy, wy, wm, dc
			  , daysInYear, daysInMonth, firstDayOfMonth
			  , weekStart, weeksInYear, weeksInMonth;

			// It's not pretty, but just keep looping through all of the
			// constraints until they have all been met (or no valid 
			// occurrence exists). All calculations are done just in time to
			// prevent extra work from being done each loop.
			while (next) {

				// check year
				Y = getYear.call(next);
				if (sched.Y && (inc = nextInRange(Y, sched.Y, 0)) != Y ) {
					next = inc > Y ? date(inc,0,1) : null;
					continue;
				}

				// check day of year (one based)
				oJan1 = date(Y, 0, 1);
				oDec31 = date(Y + 1, 0, 0);
				if (sched.dy) {
					dy = ceil((next.getTime() - oJan1.getTime() + 1)/DAY);
					daysInYear = ceil((oDec31.getTime() - oJan1.getTime() + 1)/DAY);				 	
					if ((inc = nextInRange(dy, sched.dy, daysInYear)) != dy) {
						next = date(Y, 0, inc);
						continue;
					} 
				}

				// check month (zero based)
				M = getMonth.call(next)
				if (sched.M && (inc = nextInRange(M, sched.M, 12)) != M) {
					next = date(Y, inc, 1);
					continue;
				}

				// check week of year (one based, ISO week)
				D = getDate.call(next);
				d = getDay.call(next);
				if (sched.wy) {
					oWeekStart = date(Y, M, D + 4 - (d || 7));		
					oWeekStartY = date(getYear.call(oWeekStart),0,1);			
					weeksInYear = getDay.call(oJan1) === 4 || 
						getDay.call(oDec31) === 4 ? 53 : 52;
					
					wy = ceil((((oWeekStart.getTime()-oWeekStartY.getTime())/DAY)+1)/7);
					if ((inc = nextInRange(wy, sched.wy, weeksInYear)) != wy) {
						next = date(
								getYear.call(oWeekStart),
								getMonth.call(oWeekStart),
								getDate.call(oWeekStart) - 3 + (inc - wy) * 7);
						continue;
					}
				}

				// check date of month (one based)
				oMonthEnd = date(Y, M + 1, 0);
				daysInMonth = getDate.call(oMonthEnd);
				if (sched.D && (inc = nextInRange(D, sched.D, daysInMonth)) != D) {
					next = date(Y, M, inc);
					continue;
				}

				// check week of month (one based, 0 for last week of month)
				if (sched.wm) {
					firstDayOfMonth = getDay.call(date(Y, M, 1));
					wm = floor((((D + firstDayOfMonth - 1)/7))+1);
					weeksInMonth = floor((((daysInMonth + firstDayOfMonth - 1)/7))+1);
					if ((inc = nextInRange(wm, sched.wm, weeksInMonth)) != wm) {
						// jump to the Sunday of the desired week, making sure not
						// to double count the last week in the month if we cross
						// a month boundary
						next = date(Y, M, Math.max(1, (inc-1) * 7 
						    - (firstDayOfMonth - 1) 											
							- (inc > weeksInMonth && getDay.call(oMonthEnd) < 6 ? 7 : 0))); 
						continue;
					}
				}

				// check day of week (zero based)
				if (sched.d && (inc = nextInRange(d, sched.d, 7)) != d) {
					next = date(Y, M, D + inc - d);
					continue;
				}

				// check day of week count (zero based, -1 for last instance)
				if (sched.dc) {
					dc = floor((D - 1) / 7);
					if ((inc = nextInRange(dc, sched.dc, 0)) != dc) {
						if (inc >= 0) {
							next = date(Y, M + (inc < dc ? 1 : 0), 1 + (7 * inc));
							continue;
						}
						//special last day instance of month constraint
						if (inc < 0 && D < (daysInMonth - 6)) {
							next = date(Y, M, daysInMonth - 6);
							continue;						
						}
					}				
				}

				// check hour of day (zero based)
				h = getHour.call(next);
				if (sched.h && (inc = nextInRange(h, sched.h, 24)) != h) {
					next = date(Y, M, D, inc);
					continue;
				}			

				// check minute of hour (zero based)
				m = getMin.call(next);		
				if (sched.m && (inc = nextInRange(m, sched.m, 60)) != m) {
					next = date(Y, M, D, h, inc);
					continue;
				}

				// check second of minute (zero based)
				s = getSec.call(next);			
				if (sched.s && (inc = nextInRange(s, sched.s, 60)) != s) {
					next.setSeconds(inc);
					next = date(Y, M, D, h, m, inc);
					continue;
				}

				// check time of day (24-hr)
				if (sched.t) {
					t = pad(h) +':'+ pad(m) +':'+ pad(s);
					if ((inc = nextInRange(t, sched.t, '')) != t) {
						x = inc.split(':');
						next = date(Y, M, D + (t > inc ? 1 : 0), x[0], x[1], x[2]);
						continue;
					}
				}

				// if we make it this far, all constraints have been met
				break;
			}

			return next;
		}

		/**
	   	* Finds the next valid value which is either the next largest valid
	   	* value or the minimum valid value if no larger value exists. To
	   	* simplify some calculations, the min value is added to a specified
	   	* offset.  
	   	* 
	   	* For example, if the current minute is 5 and the next valid 
	   	* value is 1, the offset will be set to 60 (max number of minutes) and
	   	* nextInRange will return 61. This is the number of minutes that must
	   	* be added to the current time to get to the next valid minute.
	   	*
	   	* @param {Int/String} val: The current value
	   	* @param {[]} values: Array of possible valid values
	   	* @param {Int/String} minOffset: Value to add to the minimum value
	   	*/
		var nextInRange = function(val, values, minOffset) {
			var cur, next, min = values[0], i = values.length;
			while (i--) {
				cur = values[i];
				if (cur === val) return val;
				min = cur < min ? cur : min;
				next = cur > val && (!next || cur < next) ? cur : next;				
			}

			return next || (min + minOffset);
		};

		/**
	   	* Builds and returns a new Date using the specified values.  Date
	   	* returns is either using Local time or UTC based on isLocal. 
	   	*
	   	* @param {Int} yr: Four digit year
	   	* @param {Int} mt: Month between 0 and 11
	   	* @param {Int} dt: Date between 1 and 31
	   	* @param {Int} hr: Hour between 0 and 23, defaults to 0
	   	* @param {Int} mn: Minute between 0 and 59, defaults to 0
	   	* @param {Int} sc: Second between 0 and 59, defaults to 0
	   	*/
		var date = function(yr, mt, dt, hr, mn, sc) {
			return isLocal ? new Date(yr, mt, dt, hr || 0, mn || 0, sc || 0) :
				new Date(Date.UTC(yr, mt, dt, hr || 0, mn || 0, sc || 0));
		}

		/**
	   	* Pads a digit with a leading zero if it is less than 10.
	   	*
	   	* @param {Int} val: The value that needs to be padded
	   	*/
		var pad = function(val) {
			return (val < 10 ? '0' : '') + val;
		}

		/**
	   	* Returns a new date object that represents the next possible valid
	   	* occurrence based on the resolution that has beeen configured.
	   	*
	   	* @param {Date} date: The Date object to be incremented
	   	*/
		var tick = function(date) {
			return new Date(date.getTime() + (resolution * 1000));
		}

		return {

			/**
		   	* Returns true if the specified date meets all of the constraints
		   	* defined within the specified schedule. 
		   	*
		   	* @param {Recur} recur: Set of schedule and exception constraints
		   	* @param {Date} date: The date to validate against
		   	* @api public
		   	*/
			isValid: function (recur, date) {
				return date == this.getNext(recur, date);
			},

			/**
		   	* Returns the next one or more valid occurrences of a schedule. 
		   	*
		   	* @param {Recur} recur: Set of schedule and exception constraints
		   	* @param {Int} count: The number of occurrences to return
		   	* @param {Date} startDate: The initial date to start looking from
		   	* @api public
		   	*/
			get: function (recur, count, startDate) {
				var occurrences = []				
				  , date;
				 
				while (count-- > 0 && 
					     (date = this.getNext(recur, date || startDate))) {
					occurrences.push(date);
					date = tick(date);
				}

				return occurrences;
			},

			/**
		   	* Returns the next valid occurrence of a schedule. 
		   	*
		   	* @param {Recur} recur: Set of schedule and exception constraints
		   	* @param {Date} startDate: The initial date to start looking from
		   	* @api public
		   	*/
			getNext: function (recur, startDate) {
				var schedules = recur.schedules || []
				  , exceptions = {schedules: recur.exceptions || []}
				  , start = startDate || new Date				
				  , date, tDate
				  , i = schedules.length;
				 					
				while(i--) {
					tDate = getNextForSchedule(schedules[i], start);
					if (!date || (tDate < date)) {
						date = tDate;
					}
				}

				if (date && exceptions.schedules.length > 0 &&
						this.isValid (exceptions, date)) {
					date = this.getNext(recur, tick(date));
				}

				return date;				
			}
		}
	};

  	/**
   	* Allow library to be used within both the browser and node.js
   	*/
	if (typeof exports !== 'undefined') {
		exports = module.exports = Later;
	} else {
		this['later'] = Later;
	}	

}).call(this);

  

