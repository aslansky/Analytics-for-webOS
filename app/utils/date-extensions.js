/*  DepressedPress.com DP_DateExtensions

Author: Jim Davis, the Depressed Press of Boston
Date: June 20, 2006
Contact: webmaster@depressedpress.com
Website: www.depressedpress.com

Full documentation can be found at:
http://www.depressedpress.com/Content/Development/JavaScript/Extensions/

DP_DateExtensions adds features to the JavaScript "Date" datatype.

Copyright (c) 1996-2006, The Depressed Press of Boston (depressedpress.com)

All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

+) Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

+) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

+) Neither the name of the DEPRESSED PRESS OF BOSTON (DEPRESSEDPRESS.COM) nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
/* "Date" Object Extensions */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

	// is
	// Checks if an object is a Date object
Date.is = function(Ob) {
	try {
		if ( typeof Ob == "object" ) {
			if ( Ob.constructor == Date ) {
				return true;
			};
		};
	} catch (CurError) { };
	return false;
};


	// parseFormat
	// Accepts a date/time format and a string and returns either a date (if the format matches) or null
Date.parseFormat = function(CurDate, Mask, DefaultTo) {

		// Check the input parameters
	if ( typeof CurDate != "string" || CurDate == "" ) {
		return null;
	};
	if ( typeof Mask != "string" || Mask == "" ) {
		return null;
	};
	if ( typeof DefaultTo != 0 && DefaultTo != 1 && DefaultTo != 2 ) {
		DefaultTo = 0;
	};

		// Set Mask Characters
	var MaskChars = "DMYhHmsltTz";
		// SetRegEx chars (these need to be escaped in the Mask)
	var RegExChars = "^$.*+?=!:|\\/()[]{}-";
		// Set a reference object for month names
	var MonthRef = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11}
		// Begin the RegEx
	var RegEx = "";
		// Tack a temporary space at the end of the mask to ensure that the last character isn't a mask character
	Mask += " ";

		// Default the positions of the date fragments
		// 0 = year, 1 = month, 2 = day, 3 = hour, 4 = minute, 5 = second, 6 = millisecond, 7 = ampmind, 8 = TimeZone
	var DF = [null,null,null,null,null,null,null, null];

		// Parse the Mask
	var CurChar;
	var MaskPart = "";
	var MaskPartCnt = 1;
		// Loop over the mask, character by character
	for ( var Cnt = 0; Cnt < Mask.length; Cnt++ ) {
			// Get the character
		CurChar = Mask.charAt(Cnt);
			// Determine if the character is a mask element
		if ( ( MaskChars.indexOf(CurChar) == -1 ) || ( MaskPart != "" && CurChar != MaskPart.charAt(MaskPart.length - 1) ) ) {
				// Determine if we need to parse a MaskPart or not
			if ( MaskPart != "" ) {
					// Set the position of the mask part
				switch (MaskPart) {
					case "YY":
					case "YYYY":
						DF[0] = MaskPartCnt;
						break;
					case "M":
					case "MM":
					case "MMM":
					case "MMMM":
						DF[1] = MaskPartCnt;
						break;
					case "D":
					case "DD":
					case "DDD":
					case "DDDD":
						DF[2] = MaskPartCnt;
						break;
					case "h":
					case "hh":
					case "H":
					case "HH":
						DF[3] = MaskPartCnt;
						break;
					case "m":
					case "mm":
						DF[4] = MaskPartCnt;
						break;
					case "s":
					case "ss":
						DF[5] = MaskPartCnt;
						break;
					case "l":
						DF[6] = MaskPartCnt;
						break;
					case "t":
					case "T":
					case "tt":
					case "TT":
						DF[7] = MaskPartCnt;
						break;
					case "z":
						DF[8] = MaskPartCnt;
						break;
				};
 					// Convert the mask part to a regex fragment
				switch (MaskPart) {
					case "h":
						RegEx += "(1[0-2]|[1-9])";
						break;
					case "hh":
						RegEx += "(1[0-2]|0[1-9])";
						break;
					case "H":
						RegEx += "(2[0-4]|1[0-9]|[0-9])";
						break;
					case "HH":
						RegEx += "(2[0-4]|1[0-9]|0[0-9])";
						break;
					case "s":
					case "m":
						RegEx += "([0-5]?[0-9])";
						break;
					case "ss":
					case "mm":
						RegEx += "([0-5]?[0-9])";
						break;
					case "l":
						RegEx += "([0-9]+)";
						break;
					case "t":
					case "T":
						RegEx += "(a|p)";
						break;
					case "tt":
					case "TT":
						RegEx += "(am|pm)";
						break;
					case "D":
						RegEx += "((?:3[01])|(?:[12][0-9])|(?:0[1-9])|[1-9])";
						break;
					case "DD":
						RegEx += "((?:3[01])|(?:[12][0-9])|(?:0[1-9]))";
						break;
					case "DDD":
						RegEx += "(sun|mon|tue|wed|thu|fri|sat)";
						break;
					case "DDDD":
						RegEx += "(sunday|monday|tuesday|wednesday|thursday|friday|saturday)";
						break;
					case "M":
						RegEx += "((?:1[012])|(?:0[1-9])|[1-9])";
						break;
					case "MM":
						RegEx += "((?:1[012])|(?:0[1-9]))";
						break;
					case "MMM":
						RegEx += "(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)";
						break;
					case "MMMM":
						RegEx += "(january|february|march|april|may|june|july|august|september|october|november|december)";
						break;
					case "YY":
						RegEx += "([0-9]{2})";
						break;
					case "YYYY":
						RegEx += "((?:1[6-9]|[2-9][0-9])[0-9]{2})";
						break;
					case "z":
						RegEx += "(Z|UT|[\+\-](?:1[012]|[0]?[0-9])(?::?[0-5]?[0-9]))";
						break;
				};
					// Reset the MaskPart to nothing
				MaskPart = "";
					// Increment the count of discovered mask parts
				MaskPartCnt++;
			};
				// If the char is a mask char, start a new mask part, otherwise, dump it to the output
			if ( MaskChars.indexOf(CurChar) > -1 ) {
				MaskPart = CurChar;
			} else {
					// The character isn't a mask character
				if ( RegExChars.indexOf(CurChar) >= 0 ) {
					RegEx += "\\";
				};
				RegEx += CurChar;
			};
		} else {
				// Add the current mask character to the MaskPart
			MaskPart += CurChar;
		};
	};
		// Remove the temporary space from the end of the formatted date
	RegEx = RegEx.substring(0,RegEx.length - 1);

		// Try to parse the input
	var ParsedDF;
	if (ParsedDF = new RegExp("^" + RegEx + "$", "i").exec(CurDate)) {};
		// If the date couldn't be parsed, return null
	if ( !ParsedDF ) { return null };
		// Replace the date fragment positions with the actual dates

	for (var Cnt = 0; Cnt < DF.length; Cnt++) {
		if ( DF[Cnt] != null ) {
			DF[Cnt] = ParsedDF[DF[Cnt]];
		};
	};

		// Set Month, if present
	if ( DF[1] != null ) {
		var CurDF = MonthRef[DF[1].substring(0,3).toLowerCase()];
		if ( CurDF != null ) {
			DF[1] = CurDF;
		} else {
			DF[1] = DF[1]-1;
		};
	};
		// Set AM/PM, if present (Hours must be present and less than 12 for it to matter)
	if ( DF[7] != null && DF[3] != null && DF[3] < 13 ) {
		var CurAP = DF[7].substring(0,1).toLowerCase();
		if ( CurAP == "p" ) {
			DF[3] = DF[3] + 12;
		};
	};

		// Set defaults is current time, set the values
	if ( DefaultTo == 0 ) {
		// No changes needed for this default
	} else if ( DefaultTo == 1 ) {
			// Set the Current Date Parts
		var NowDate = new Date();
		if ( DF[0] == null ) { DF[0] = NowDate.getFullYear() };
		if ( DF[1] == null ) { DF[1] = NowDate.getMonth() };
		if ( DF[2] == null ) { DF[2] = NowDate.getDate() };
		if ( DF[3] == null ) { DF[3] = NowDate.getHours() };
		if ( DF[4] == null ) { DF[4] = NowDate.getMinutes() };
		if ( DF[5] == null ) { DF[5] = NowDate.getSeconds() };
		if ( DF[6] == null ) { DF[6] = NowDate.getMilliseconds() };
	} else if ( DefaultTo == 2 ) {
		var NowDate = new Date();
		if ( DF[0] == null ) { DF[0] = NowDate.getUTCFullYear() };
		if ( DF[1] == null ) { DF[1] = NowDate.getUTCMonth() };
		if ( DF[2] == null ) { DF[2] = NowDate.getUTCDate() };
		if ( DF[3] == null ) { DF[3] = NowDate.getUTCHours() };
		if ( DF[4] == null ) { DF[4] = NowDate.getUTCMinutes() };
		if ( DF[5] == null ) { DF[5] = NowDate.getUTCSeconds() };
		if ( DF[6] == null ) { DF[6] = NowDate.getUTCMilliseconds() };
	};

		// If there's no timezone info the data is local time
	if (DF[8] == null) {
		return new Date(DF[0], DF[1], DF[2], DF[3], DF[4], DF[5], DF[6]);
	} else {
			// If Timezone indicator is "Z" or "UT", it's UTC, otherwise it's an offset and needs to be figured out
		if (DF[8] == "Z" || DF[8] == "UT") {
			return new Date(Date.UTC(DF[0], DF[1], DF[2], DF[3], DF[4], DF[5], DF[6]));
		} else {
				// Regex value to split the parts
			var ParsedTZ = new RegExp("^([\+\-])(1[012]|[0]?[0-9])(?::?)([0-5]?[0-9])$").exec(DF[8])
				// Get current Timezone information
			var CurTZ = new Date().getTimezoneOffset();
			var CurTZh = ParsedTZ[1] + ParsedTZ[2] - ((CurTZ >= 0 ? "-" : "+") + Math.floor(Math.abs(CurTZ) / 60))
			var CurTZm = ParsedTZ[1] + ParsedTZ[3] - ((CurTZ >= 0 ? "-" : "+") + (Math.abs(CurTZ) % 60))
				// Return the date
			return new Date(DF[0], DF[1], DF[2], DF[3] - CurTZh, DF[4] - CurTZm, DF[5], DF[6]);
		};
	};
		// If we've reached here we couldn't deal with the input, return null
	return null;

};

	// parseHttpTimeFormat
	// Converts a string formated as a date using RFC 822 specification
Date.parseHttpTimeFormat = function(CurDate) {

		// Check the input parameters
	if ( typeof CurDate != "string" || CurDate == "" ) {
		return null;
	};

	return Date.parseFormat(CurDate, "DDD, D MMM YYYY HH:mm:ss z");

};

	// parseIso8601
	// Attempts to convert ISO8601 input to a date
Date.parseIso8601 = function(CurDate) {

		// Check the input parameters
	if ( typeof CurDate != "string" || CurDate == "" ) {
		return null;
	};
		// Set the fragment expressions
	var S = "[\\-/:.]";
	var Yr = "((?:1[6-9]|[2-9][0-9])[0-9]{2})";
	var Mo = S + "((?:1[012])|(?:0[1-9])|[1-9])";
	var Dy = S + "((?:3[01])|(?:[12][0-9])|(?:0[1-9])|[1-9])";
	var Hr = "(2[0-4]|[01]?[0-9])";
	var Mn = S + "([0-5]?[0-9])";
	var Sd = "(?:" + S + "([0-5]?[0-9])(?:[.,]([0-9]+))?)?";
	var TZ = "(?:(Z)|(?:([\+\-])(1[012]|[0]?[0-9])(?::?([0-5]?[0-9]))?))?";
		// RegEx the input
		// First check: Just date parts (month and day are optional)
		// Second check: Full date plus time (seconds, milliseconds and TimeZone info are optional)
	var TF;
	if ( TF = new RegExp("^" + Yr + "(?:" + Mo + "(?:" + Dy + ")?)?" + "$").exec(CurDate) ) {} else if ( TF = new RegExp("^" + Yr + Mo + Dy + "[Tt ]" + Hr + Mn + Sd + TZ + "$").exec(CurDate) ) {};
		// If the date couldn't be parsed, return null
	if ( !TF ) { return null };
		// Default the Time Fragments if they're not present
	if ( !TF[2] ) { TF[2] = 1 } else { TF[2] = TF[2] - 1 };
	if ( !TF[3] ) { TF[3] = 1 };
	if ( !TF[4] ) { TF[4] = 0 };
	if ( !TF[5] ) { TF[5] = 0 };
	if ( !TF[6] ) { TF[6] = 0 };
	if ( !TF[7] ) { TF[7] = 0 };
	if ( !TF[8] ) { TF[8] = null };
	if ( TF[9] != "-" && TF[9] != "+" ) { TF[9] = null };
	if ( !TF[10] ) { TF[10] = 0 } else { TF[10] = TF[9] + TF[10] };
	if ( !TF[11] ) { TF[11] = 0 } else { TF[11] = TF[9] + TF[11] };
		// If there's no timezone info the data is local time
	if ( !TF[8] && !TF[9] ) {
		return new Date(TF[1], TF[2], TF[3], TF[4], TF[5], TF[6], TF[7]);
	};
		// If the UTC indicator is set the date is UTC
	if ( TF[8] == "Z" ) {
		return new Date(Date.UTC(TF[1], TF[2], TF[3], TF[4], TF[5], TF[6], TF[7]));
	};
		// If the date has a timezone offset
	if ( TF[9] == "-" || TF[9] == "+" ) {
			// Get current Timezone information
		var CurTZ = new Date().getTimezoneOffset();
		var CurTZh = TF[10] - ((CurTZ >= 0 ? "-" : "+") + Math.floor(Math.abs(CurTZ) / 60))
		var CurTZm = TF[11] - ((CurTZ >= 0 ? "-" : "+") + (Math.abs(CurTZ) % 60))
			// Return the date
		return new Date(TF[1], TF[2], TF[3], TF[4] - CurTZh, TF[5] - CurTZm, TF[6], TF[7]);
	};
		// If we've reached here we couldn't deal with the input, return null
	return null;

};


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
/* "Date" Object Prototype Extensions */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

	// isWeekday
	// Returns "true" if the date is Monday-Friday, inclusive
Date.prototype.isWeekday = function() {

	if ( this.getDay() != 0 && this.getDay() != 6 ) {
		return true;
	} else {
		return false;
	};

};

	// isLeapYear
	// Returns "true" if the date is contained within a leap year
Date.prototype.isLeapYear = function() {

	var CurYear = this.getFullYear();
	if ( CurYear % 400 == 0 ) {
		return true;
	} else if ( CurYear % 100 == 0 ) {
		return false;
	} else if ( CurYear % 4 == 0 ) {
		return true;
	} else {
		return false;
	};

};

	// dateFormat
	// Formats the date portion of a date object for display
Date.prototype.dateFormat = function(Mask) {

	var FormattedDate = "";
	var MaskChars = "DMY";
	var Ref_MonthFullName = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	var Ref_MonthAbbreviation = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	var Ref_DayFullName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	var Ref_DayAbbreviation = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

		// Convert any supported simple masks into "real" masks
	switch (Mask) {
		case "short":
			Mask = "M/D/YY";
		break;
		case "medium":
			Mask = "MMM D, YYYY";
		break;
		case "long":
			Mask = "MMMM D, YYYY";
		break;
		case "full":
			Mask = "DDDD, MMMM D, YYYY";
		break;
	};

		// Tack a temporary space at the end of the mask to ensure that the last character isn't a mask character
	Mask += " ";

		// Parse the Mask
	var CurChar;
	var MaskPart = "";
	for ( var Cnt = 0; Cnt < Mask.length; Cnt++ ) {
			// Get the character
		CurChar = Mask.charAt(Cnt);
			// Determine if the character is a mask element
		if ( ( MaskChars.indexOf(CurChar) == -1 ) || ( MaskPart != "" && CurChar != MaskPart.charAt(MaskPart.length - 1) ) ) {
				// Determine if we need to parse a MaskPart or not
			if ( MaskPart != "" ) {
					// Convert the mask part to the date value
				switch (MaskPart) {
					case "D":
						FormattedDate += this.getDate();
						break;
					case "DD":
						FormattedDate += ("0" + this.getDate()).slice(-2);
						break;
					case "DDD":
						FormattedDate += Ref_DayAbbreviation[this.getDay()];
						break;
					case "DDDD":
						FormattedDate += Ref_DayFullName[this.getDay()];
						break;
					case "M":
						FormattedDate += this.getMonth() + 1;
						break;
					case "MM":
						FormattedDate += ("0" + (this.getMonth() + 1)).slice(-2);
						break;
					case "MMM":
						FormattedDate += Ref_MonthAbbreviation[this.getMonth()];
						break;
					case "MMMM":
						FormattedDate += Ref_MonthFullName[this.getMonth()];
						break;
					case "YY":
						FormattedDate += ("0" + this.getFullYear()).slice(-2);
						break;
					case "YYYY":
				        FormattedDate += ("000" + this.getFullYear()).slice(-4);
						break;
				};
					// Reset the MaskPart to nothing
				MaskPart = "";
			};
				// If the char is a mask char, start a new mask part, otherwise, dump it to the output
			if ( MaskChars.indexOf(CurChar) > -1 ) {
				MaskPart = CurChar;
			} else {
				FormattedDate += CurChar;
			};
		} else {
				// Add the current mask character to the MaskPart
			MaskPart += CurChar;
		};
	};

		// Remove the temporary space from the end of the formatted date
	FormattedDate = FormattedDate.substring(0,FormattedDate.length - 1);

		// Return the formatted date
	return FormattedDate;

};


	// timeFormat
	// Formats the time portion of a Date object for display
Date.prototype.timeFormat = function(Mask) {

	var FormattedTime = "";
	var MaskChars = "hHmsltT";

		// Convert any supported simple masks into "real" masks
	switch (Mask) {
		case "short":
			Mask = "h:mm tt";
		break;
		case "medium":
			Mask = "h:mm:ss tt";
		break;
		case "long":
			Mask = "h:mm:ss.l tt";
		break;
		case "full":
			Mask = "h:mm:ss.l tt";
		break;
	};

		// Tack a temporary space at the end of the mask to ensure that the last character isn't a mask character
	Mask += " ";

		// Parse the Mask
	var CurChar;
	var MaskPart = "";
	for ( var Cnt = 0; Cnt < Mask.length; Cnt++ ) {
			// Get the character
		CurChar = Mask.charAt(Cnt);
			// Determine if the character is a mask element
		if ( ( MaskChars.indexOf(CurChar) == -1 ) || ( MaskPart != "" && CurChar != MaskPart.charAt(MaskPart.length - 1) ) ) {
				// Determine if we need to parse a MaskPart or not
			if ( MaskPart != "" ) {
					// Convert the mask part to the date value
				switch (MaskPart) {
					case "h":
						var CurValue = this.getHours();
						if ( CurValue >  12 ) {
							CurValue = CurValue - 12;
						};
						FormattedTime += CurValue;
						break;
					case "hh":
						var CurValue = this.getHours();
						if ( CurValue >  12 ) {
							CurValue = CurValue - 12;
						};
						FormattedTime += ("0" + CurValue).slice(-2);
						break;
					case "H":
						FormattedTime += ("0" + this.getHours()).slice(-2);
						break;
					case "HH":
						FormattedTime += ("0" + this.getHours()).slice(-2);
						break;
					case "m":
						FormattedTime += this.getMinutes();
						break;
					case "mm":
						FormattedTime += ("0" + this.getMinutes()).slice(-2);
						break;
					case "s":
						FormattedTime += this.getSeconds();
						break;
					case "ss":
						FormattedTime += ("0" + this.getSeconds()).slice(-2);
						break;
					case "l":
						FormattedTime += ("00" + this.getMilliseconds()).slice(-3);
						break;
					case "t":
						if ( this.getHours() > 12 ) {
							FormattedTime += "p";
						} else {
							FormattedTime += "a";
						};
						break;
					case "tt":
						if ( this.getHours() > 12 ) {
							FormattedTime += "pm";
						} else {
							FormattedTime += "am";
						};
						break;
					case "T":
						if ( this.getHours() > 12 ) {
							FormattedTime += "P";
						} else {
							FormattedTime += "A";
						};
						break;
					case "TT":
						if ( this.getHours() > 12 ) {
							FormattedTime += "PM";
						} else {
							FormattedTime += "AM";
						};
						break;
				};
					// Reset the MaskPart to nothing
				MaskPart = "";
			};
				// If the char is a mask char, start a new mask part, otherwise, dump it to the output
			if ( MaskChars.indexOf(CurChar) > -1 ) {
				MaskPart = CurChar;
			} else {
				FormattedTime += CurChar;
			};
		} else {
				// Add the current mask character to the MaskPart
			MaskPart += CurChar;
		};
	};

		// Remove the temporary space from the end of the formatted date
	FormattedTime = FormattedTime.substring(0,FormattedTime.length - 1);

		// Return the formatted date
	return FormattedTime;

};


	// iso8601Format
	// Formats a date using an ISO8601-compliant format
Date.prototype.iso8601Format = function(Style, isUTC) {

		// Set the default
	if ( typeof Style != "string" && typeof Style != "number" ) {
		var Style = "YMDHMSM";
	};

	var FormattedDate = "";
	var AddTZ = false;

	switch (Style) {
		case "Y":
		case 1:
			FormattedDate += this.dateFormat("YYYY");
			break;
		case "YM":
		case 2:
			FormattedDate += this.dateFormat("YYYY-MM");
			break;
		case "YMD":
		case 3:
			FormattedDate += this.dateFormat("YYYY-MM-DD");
			break;
		case "YMDHM":
		case 4:
			FormattedDate += this.dateFormat("YYYY-MM-DD") + "T" + this.timeFormat("HH:mm");
			AddTZ = true;
			break;
		case "YMDHMS":
		case 5:
			FormattedDate += this.dateFormat("YYYY-MM-DD") + "T" + this.timeFormat("HH:mm:ss");
			AddTZ = true;
			break;
		case "YMDHMSM":
		case 6:
			FormattedDate += this.dateFormat("YYYY-MM-DD") + "T" + this.timeFormat("HH:mm:ss.l");
			AddTZ = true;
			break;
	};

	if ( AddTZ ) {
		if ( isUTC ) {
			FormattedDate += "Z";
		} else {
				// Get TimeZone Information
			var TimeZoneOffset = this.getTimezoneOffset();
			var TimeZoneInfo = (TimeZoneOffset >= 0 ? "-" : "+") + ("0" + (Math.floor(Math.abs(TimeZoneOffset) / 60))).slice(-2) + ":" + ("00" + (Math.abs(TimeZoneOffset) % 60)).slice(-2);
			FormattedDate += TimeZoneInfo;
		};
	};

		// Return the date
	return FormattedDate;

};

	// httpTimeFormat
	// Formats a date using the specification in RFC 822-defined format
Date.prototype.httpTimeFormat = function(isUTC) {

	var FormattedDate = "";
	FormattedDate += this.dateFormat("DDD, D MMM YYYY ");
	FormattedDate += this.timeFormat("HH:mm:ss ");

	if ( isUTC ) {
		FormattedDate += "UT";
	} else {
			// Get TimeZone Information
		var TimeZoneOffset = this.getTimezoneOffset();
		var TimeZoneInfo = (TimeZoneOffset >= 0 ? "-" : "+") + ("0" + (Math.floor(Math.abs(TimeZoneOffset) / 60))).slice(-2) + ("00" + (Math.abs(TimeZoneOffset) % 60)).slice(-2);
		FormattedDate += TimeZoneInfo;
	};

		// Return the date
	return FormattedDate;

};


	// dayOfYear
	// Returns the day of the year
Date.prototype.dayOfYear = function() {

	var FirstOfYear = new Date(this.getFullYear(), 0, 1);
	return this.diff(FirstOfYear, "days") + 1;

};

	// weekOfYear
	// Returns the week of the year
Date.prototype.weekOfYear = function() {

	var FirstOfYear = new Date(this.getFullYear(), 0, 1);
	return this.diff(FirstOfYear, "weeks") + 1;

};

Date.prototype.daysInMonth = function() {
    var dd = new Date(this.getFullYear(), this.getMonth() + 1, 0);
    return dd.getDate();
};

Date.prototype.lastDayInMonth = function () {
    var dd = new Date(this.getFullYear(), this.getMonth(), this.daysInMonth());
    return dd;
};

Date.prototype.firstDayInMonth = function () {
    var dd = new Date(this.getFullYear(), this.getMonth(), 1);
    return dd;
}

	// add
	// Adds a specified number of a specified date unit to a date
Date.prototype.add = function(Amount, DatePart, Destructive) {

	DatePart = DatePart.toLowerCase();

	var ReturnDate = new Date(this);
	var CurAbsAmount = Math.abs(Amount);

		// Set the Multiplication factors for unambigiuos times (MS times these will result in the appropriate data part)
	var Factors = new Object();
	Factors.milliseconds = 1;	// 1 ms to the ms (1 * 1000)
	Factors.seconds = 1000;		// 1000 ms to the second (1 * 1000)
	Factors.minutes = 60000;	// 60 seconds to the minute (1 * 1000 * 60)
	Factors.quarterhours = 900000;	// 15 minutes to the quarter hour (1 * 1000 * 60 * 15)
	Factors.warhols = 900000;	// 15 minutes of fame (1 * 1000 * 60 * 15)
	Factors.halfhours = 1800000;	// 30 minutes to the half hour (1 * 1000 * 60 * 15)
	Factors.hours = 3600000;	// 60 minutes to the hour (1 * 1000 * 60 * 60)
	Factors.days = 86400000;	// 24 hours to the day (1 * 1000 * 60 * 60 * 24)
	Factors.weeks = 604800000;	// 7 days per week (1 * 1000 * 60 * 60 * 24 * 7)

		// Do the math
	switch (DatePart) {
			// The following are all unambigously convertable to ms equivalents
		case "milliseconds":
		case "seconds":
		case "minutes":
		case "quarterhours":
		case "warhols":
		case "halfhours":
		case "hours":
		case "days":
		case "weeks":
			ReturnDate = new Date( this.getTime() + (Amount * Factors[DatePart]) );
			break;
		case "businessdays":
			if ( CurAbsAmount > 5 ) {
				var CurWeeks = Math.floor(CurAbsAmount / 5);
				var CurDays = CurAbsAmount % 5;
				if ( Amount < 0 ) {
					CurWeeks = -CurWeeks;
					CurDays = -CurDays;
				};
			} else {
				var CurWeeks = 0;
				var CurDays = Amount;
			};
				// Add the number of weeks to the date
			ReturnDate = ReturnDate.add(CurWeeks, "weeks");
				// Now add the days
			ReturnDate = ReturnDate.add(CurDays, "days");
				// If we've landed on a weekend push us
			if ( ReturnDate.getDay() == 0  ) {
				if ( Amount < 0 ) {
					ReturnDate = ReturnDate.add(-2, "days");
				} else {
					ReturnDate = ReturnDate.add(1, "days");
				};
			};
			if ( ReturnDate.getDay() == 6  ) {
				if ( Amount < 0 ) {
					ReturnDate = ReturnDate.add(-1, "days");
				} else {
					ReturnDate = ReturnDate.add(2, "days");
				};
			};
            break;
		case "businessweeks":
			ReturnDate = ReturnDate.add(Amount * 5, "businessdays");
			break;
		case "wholeweeks":
				// Move to the nearest Sunday
			if ( Amount < 0 ) {
				ReturnDate = ReturnDate.add(-(ReturnDate.getDay()), "days");
			} else {
				ReturnDate = ReturnDate.add(ReturnDate.getDay() + (6 - ReturnDate.getDay()), "days");
			};
				// Now add the weeks
			ReturnDate = ReturnDate.add(Amount, "weeks");
			break;
		case "months":
				// Months are tricky - they have different number of days
				// First split the amount into the number of years and months
			if ( CurAbsAmount > 11 ) {
				var CurYears = Math.floor(CurAbsAmount / 12);
				var CurMonths = CurAbsAmount % 12;
				if ( Amount < 0 ) {
					CurYears = -CurYears;
					CurMonths = -CurMonths;
				};
			} else {
				var CurYears = 0;
				var CurMonths = Amount;
			};
				// Add the number of years to the date
			ReturnDate = ReturnDate.add(CurYears, "years");
				// Now add the months
			var TempReturnDate = new Date(ReturnDate);
			TempReturnDate.setDate(1);
			TempReturnDate = new Date( new Date(TempReturnDate).setMonth(TempReturnDate.getMonth() + CurMonths) );
			ReturnDate = new Date( new Date(ReturnDate).setMonth(ReturnDate.getMonth() + CurMonths) );
				// Determine if the months got thrown off (due to too many days in the current month compared to the target)
			if ( ReturnDate.getMonth() != TempReturnDate.getMonth() ) {
					// Set the date to the last day of the previous month
				ReturnDate.setDate(0)
			};

			break;
		case "years":
				// February 29th may cause problems
			var Feb29 = false;
			if ( ReturnDate.getMonth() == 1 && ReturnDate.getDate() == 29 ) {
				Feb29 = true;
			};
				// Add Years directly as a data part
			ReturnDate = new Date( new Date(this).setFullYear(this.getFullYear() + Amount) );
				// If Feb29th then check to ensure that the date hasn't changed the month
			if ( Feb29 ) {
				if ( ReturnDate.getMonth != 1 ) {
					ReturnDate.setDate(0);
				};
			};
			break;
	};

		// Return the time
	if ( !Destructive ) {
		return ReturnDate;
	} else {
		this.setTime(ReturnDate.getTime());
		return this;
	};

};


	// diff
	// Returns the difference between two dates.
Date.prototype.diff = function(CompareDate, DatePart) {

	DatePart = DatePart.toLowerCase();

	var Diff;
		// Set the dates in order, Date1 previous
	if ( this.getTime() <= CompareDate.getTime() ) {
		var Date1 = new Date(this);
		var Date2 = new Date(CompareDate);
	} else {
		var Date1 = new Date(CompareDate);
		var Date2 = new Date(this);
	};

		// Set the Multiplication factors for unambigiuos times (MS times, these will result in the appropriate data part)
	var Factors = new Object();
	Factors.milliseconds = 1;	// 1 ms to the ms (1 * 1000)
	Factors.seconds = 1000;		// 1000 ms to the second (1 * 1000)
	Factors.minutes = 60000;	// 60 seconds to the minute (1 * 1000 * 60)
	Factors.quarterhours = 900000;	// 15 minutes to the quarter hour (1 * 1000 * 60 * 15)
	Factors.warhols = 900000;	// 15 minutes of fame (1 * 1000 * 60 * 15)
	Factors.halfhours = 1800000;	// 30 minutes to the half hour (1 * 1000 * 60 * 15)
	Factors.hours = 3600000;	// 60 minutes to the hour (1 * 1000 * 60 * 60)
	Factors.days = 86400000;	// 24 hours to the day (1 * 1000 * 60 * 60 * 24)
	Factors.weeks = 604800000;	// 7 days per week (1 * 1000 * 60 * 60 * 24 * 7)

		// Do the math
	switch (DatePart) {
			// The following are all unambigously convertable to ms equivalents
		case "milliseconds":
		case "seconds":
		case "minutes":
		case "quarterhours":
		case "warhols":
		case "halfhours":
		case "hours":
		case "days":
		case "weeks":
				// Get the Base Difference (the difference in ms)
			var BaseDiff = Date1.getTime() - Date2.getTime();
				// Set the Diff
			Diff = parseInt( BaseDiff / Factors[DatePart] );
			break;
		case "businessdays":
				// Count through the business days
			var BDaysCnt = 0;
			while ( Date1.getTime() < Date2.getTime() ) {
				Date1 = Date1.add(1, "days");
				if ( Date1.getDay() > 0 && Date1.getDay() < 6 ) {
					BDaysCnt++;
				};
			};
			if ( Date2.getDay() == 0 || Date2.getDay() == 6 ) {
				Diff = BDaysCnt;
			} else {
					// Determine if the two partial days equal a whole day
				if ( Date1.diff(Date2, "days") > 0 ) {
					Diff = BDaysCnt;
				} else {
					Diff = BDaysCnt - 1;
				};
			};
            break;
		case "businessweeks":
			Diff = parseInt( Date1.diff(Date2, "businessdays") / 5 );
			break;
		case "wholeweeks":
				// Move Date1 to the nearest Sunday
			Date1 = Date1.add(Date1.getDay() + (6 - Date1.getDay()), "days");
				// Now get the number of weeks between the new dates
			Diff = Date1.diff(Date2, "weeks");
			break;
		case "months":
				// Get the months for years (if any)
			var MonthsCnt = Date1.diff(Date2, "years") * 12;
				// Add the months from the years
			Date1 = Date1.add(MonthsCnt, "months");
				// Finish adding up the count of months
			while ( Date1.getTime() < Date2.getTime() ) {
				Date1 = Date1.add(1, "months");
				MonthsCnt++;
			};
			Diff = MonthsCnt - 1;
			break;
		case "years":
			var YearsCnt = 0;
				// Count up the years
			while ( Date1.getTime() < Date2.getTime() ) {
				Date1 = Date1.add(1, "years");
				YearsCnt++;
			};
			Diff = YearsCnt - 1;
			break;
	};

		// Return the time
	return Math.abs(Diff);

};


	// compare
	// Compares two dates (optionally using a specific datepart precision)
Date.prototype.compare = function(CompareDate, DatePart) {

	if ( !DatePart ) {
		var DatePart = "millisecond";
	};
	DatePart = DatePart.toLowerCase();

	var Date1 = new Date(this);
	var Date2 = new Date(CompareDate);

	var Result;
		// Set the precision by equalizing higher precision elements
	switch (DatePart) {
		case "millisecond":
			break;
		case "second":
			Date1.setMilliseconds(1);
			Date2.setMilliseconds(1);
			break;
		case "minute":
			Date1.setMilliseconds(1);
			Date2.setMilliseconds(1);
			Date1.setSeconds(1);
			Date2.setSeconds(1);
			break;
		case "hour":
			Date1.setMilliseconds(1);
			Date2.setMilliseconds(1);
			Date1.setSeconds(1);
			Date2.setSeconds(1);
			Date1.setMinutes(1);
			Date2.setMinutes(1);
			break;
		case "day":
			Date1.setMilliseconds(1);
			Date2.setMilliseconds(1);
			Date1.setSeconds(1);
			Date2.setSeconds(1);
			Date1.setMinutes(1);
			Date2.setMinutes(1);
			Date1.setHours(1);
			Date2.setHours(1);
			break;
		case "month":
			Date1.setMilliseconds(1);
			Date2.setMilliseconds(1);
			Date1.setSeconds(1);
			Date2.setSeconds(1);
			Date1.setMinutes(1);
			Date2.setMinutes(1);
			Date1.setHours(1);
			Date2.setHours(1);
			Date1.setDate(1);
			Date2.setDate(1);
			break;
		case "year":
			Date1.setMilliseconds(1);
			Date2.setMilliseconds(1);
			Date1.setSeconds(1);
			Date2.setSeconds(1);
			Date1.setMinutes(1);
			Date2.setMinutes(1);
			Date1.setHours(1);
			Date2.setHours(1);
			Date1.setDate(1);
			Date2.setDate(1);
			Date1.setMonth(1);
			Date2.setMonth(1);
			break;
	};

		// Do the comparison
	if ( Date1.getTime() == Date2.getTime() ) {
		Result = 0;
	} else if ( Date1.getTime() < Date2.getTime() ) {
		Result = -1;
	} else {
		Result = 1;
	};

		// Return the results
	return Result;

};

