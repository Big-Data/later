/**
* Day of Week Count Constraint (dc)
* (c) 2013 Bill, BunKat LLC.
*
* Definition for a day of week count constraint type. This constraint is used
* to specify schedules like '2nd Tuesday of every month'.
*
* Later is freely distributable under the MIT license.
* For all details and documentation:
*     http://github.com/bunkat/later
*/
later.dayOfWeekCount = later.dc = {

  /**
  * The day of week count value of the specified date.
  *
  * @param {Date} d: The date to calculate the value of
  */
  val: function(d) {
    return d.dc || (d.dc = Math.floor((later.D.val(d)-1)/7)+1);
  },

  /**
  * The minimum and maximum valid day of week count values.
  */
  extent: function(d) {
    return d.dcExtent || (d.dcExtent = [1, Math.ceil(later.D.extent(d)[1] /7)]);
  },

  /**
  * The first day of the month with the same day of week count as the date
  * specified.
  *
  * @param {Date} d: The specified date
  */
  start: function(d) {
    return d.dcStart || (d.dcStart =
      later.date.next(
        later.Y.val(d),
        later.M.val(d),
        Math.max(1, ((later.dc.val(d) - 1) * 7) + 1 || 1)));
  },

  /**
  * The last day of the month with the same day of week count as the date
  * specified.
  *
  * @param {Date} d: The specified date
  */
  end: function(d) {
    return d.dcEnd || (d.dcEnd =
      later.date.prev(
        later.Y.val(d),
        later.M.val(d),
        Math.min(later.dc.value(d) * 7), later.D.extent(d)[1]));
  },

  /**
  * Returns the next earliest date with the day of week count specified.
  *
  * @param {Date} d: The starting date
  * @param {int} val: The desired value
  */
  next: function(d, val) {
    return later.D.next(d, 1 + (7 * (val - 1)));
  },

  /**
  * Returns the closest previous date with the day of week count specified.
  *
  * @param {Date} d: The starting date
  * @param {int} val: The desired value
  */
  prev: function(d, val) {
    return later.D.prev(d, 7 + (7 * (val - 1)));
  }

};