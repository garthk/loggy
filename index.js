'use strict';
const colors = require('ansicolors');
const growl = require('growl');

const capitalize = (str) => str[0].toUpperCase() + str.slice(1);
const red1 = /^\w{3},\s|\sGMT$/g;
const red2 = /(\w{3})\s\d{4}/;

const logger = {
  // Enables / disables system notifications for errors.
  notifications: true,

  // Colors that will be used for various log levels.
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    log: 'green',
    success: 'green'
  },

  // May be used for setting correct process exit code.
  errorHappened: false,

  // Creates new colored log entry.
  // Example:
  //
  //     format('warn')
  //     # => 21 Feb 11:24:47 - warn:
  //
  // Returns String.
  format(level) {
    const raw = new Date();
    const date = raw.toGMTString().replace(red1, '').replace(red2, '$1');
    const colorName = logger.colors[level];
    const fn = colors[colorName];
    const colored = logger.colors && fn ? fn(level) : level;
    return `${date} - ${colored}:`;
  },

  _notify(level, args) {
    if (level === 'error') logger.errorHappened = true;
    const notifSettings = logger.notifications;
    
    if (notifSettings === false) {
      return;
    }

    if (logger._notificationTypes == null) {
      const items = logger._notificationTypes = {};
      if ('notifications' in logger) {
        if (typeof notifSettings === 'object') {
          notifSettings.forEach(name => items[name] = true);
        } else {
          items.error = true;
        }
      }
    }
    const types = logger._notificationTypes;

    if (logger._title == null) {
      logger._title = logger.notificationsTitle ?
        logger.notificationsTitle + ' ' : '';
    }
    const title = logger._title;

    if (types[level]) {
      growl(args.join(' '), {title: title + capitalize(level)});
    }
  },

  _log(level, args) {
    const entry = logger.format(level);
    let all = [entry].concat(args);

    if (level === 'error') {
      all = all.concat(['\u0007']);
    }

    if (level === 'error' || level === 'warn') {
      console.error.apply(console, all);
    } else {
      console.log.apply(console, all);
    }
  }
};

const slice = Array.prototype.slice;
['error', 'warn', 'info', 'log', 'success'].forEach(key => {
  logger[key] = function() {
    const args = slice.call(arguments);
    logger._notify(key, args);
    logger._log(key, args);
  };
});

module.exports = logger;
