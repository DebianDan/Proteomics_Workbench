import sys
import os
import types
import time
import re

def framedTxt(inStr):
    frameLeng = len(inStr) + 4;
    return "\n".join(("*" * frameLeng, "* " + inStr + " *" , "*" * frameLeng));

def styleFramedTxt(inStr, styleFlag=1):
    if not styleFlag: return framedTxt(inStr);
    frame = "|" + "="*(len(inStr)+2) + "|";
    return "\n".join((frame, "| " + inStr + " |", frame));

def fileIOErr(flag):
    return errMssg("Permission denied. Couldn't open a file to "+("write.", "read.")[flag]);

def errMssg(infoStr="Uknown error."):
    if type(infoStr) == types.StringType:
        return "\n".join((framedTxt("Error"), infoStr));
    elif type(infoStr) == types.TupleType:
        return "\n".join((framedTxt("Error"),) + infoStr);

def warnMssg(infoStr="Unknown warning."):
    if type(infoStr) == types.StringType:
        return "\n".join((framedTxt("Warning"), infoStr));
    elif type(infoStr) == types.TupleType:
        return "\n".join((framedTxt("Warning"),) + infoStr);

def noteMssg(infoStr="Unknown note."):
    if type(infoStr) == types.StringType:
        return "\n".join((framedTxt("Note"), infoStr));
    elif type(infoStr) == types.TupleType:
        return "\n".join((framedTxt("Note"),) + infoStr);

def findAFile(fileName, userPath=None, fullPath=False):
    """find the file named fileName in the specified userPath
    if not found, go to the folder where the main program
    is invoked or in the current working folder
    If not found in all those folders, None returned"""
    
    if userPath != None:
        fileFullPath = os.path.join(userPath, fileName);
        if os.path.isfile(fileFullPath):
            return fileFullPath;
    
    if len(sys.argv) > 0 and sys.argv[0]:
        fileFullPath = os.path.join(os.path.dirname(sys.argv[0]), fileName);
        if not os.path.isfile(fileFullPath):
            fileFullPath = os.path.join(os.getcwd(), fileName);
    else:
        fileFullPath = os.path.join(os.getcwd(), fileName);
    
    if not os.path.isfile(fileFullPath): return None;
    
    return fullPath and os.path.abspath(fileFullPath) or fileFullPath;

def quote(str, qChar='"'): return str.join((qChar,qChar));

def quoteFileName(fileName):
    if type(fileName) == types.StringType:
        return (" " in fileName) and ("\"" + fileName + "\"") or fileName;
    elif type(fileName) == types.TupleType or type(fileName) == types.ListType:
        return type(fileName)(map(quoteFileName, fileName));
    else:
        return fileName;

def attachTime2str(inStr):
    return inStr + time.strftime("-%Y-%m-%d-%H-%M-%S");

def getHtmlTagPattern():
    return re.compile(r'<.*?>|\&.*?;|^\s+|\s+$');

def getDefaultDir(fullPath=False):
    if fullPath:
        return os.path.abspath(getDefaultDir());
    
    if len(sys.argv) > 0 and sys.argv[0]:
        return os.path.dirname(sys.argv[0]);
    
    return os.getcwd();

def sysWait(Mssg="Press enter to continue ..."):
    print Mssg;
    dumpIt = sys.stdin.readline();

def sysWaitThenExit(errCode=0):
    sysWait();
    sys.exit(errCode);

def searchFiles(pattern, directory=""):
    """find files matching a pattern in a directory
    subfolders of the directory will also be searched
    """
    
    absDir = os.path.abspath(directory);
    curAbsPath = lambda file: os.path.join(absDir, file);
    
    fileAndDirList = os.listdir(absDir);
    
    fileList = filter(pattern.search, fileAndDirList);
    returnFileList  = filter(os.path.isfile, map(curAbsPath, fileList));
    
    dirList = filter(os.path.isdir, map(curAbsPath, fileAndDirList));
    for childDir in dirList:
        returnFileList.extend(searchFiles(pattern, childDir));
    
    return returnFileList;

def changeExt(origFile, newExt): return os.path.splitext(origFile)[0] + newExt;

def stripExt(fileName): return os.path.splitext(fileName)[0];

NULLFOUT = sys.platform[:5].lower() == "linux" and file("/dev/null", 'wb') or None;

def readDict(fileName, delim="=", lowerCard=False, numFlag=False):
    dic = {};
    fin = open(fileName, 'rt');
    for tline in fin:
        if len(tline) > 3:
            oneLnInfo = tline.split(delim,1);
            if len(oneLnInfo) > 1:
                oneLnInfo[0] = oneLnInfo[0].strip();
                oneLnInfo[1] = oneLnInfo[1].strip();
                if lowerCard: oneLnInfo[0] = oneLnInfo[0].lower();
                if numFlag and oneLnInfo[1].isdigit(): oneLnInfo[1] = int(oneLnInfo[1]);
                dic[oneLnInfo[0]] = oneLnInfo[1];
    fin.close();
    return dic;

def writeDict(dic, fileName, delim="="):
    fout = open(fileName, 'wt');
    for (k,v) in dic.items():
        print >>fout, delim.join((k, str(v)));
    fout.close();

def list2dic(aList):
    aDic = {};
    for i in range(len(aList)/2):
        aDic[aList[i*2]] = aList[i*2+1];
    return aDic;

def mySplit(aStr, sep=" ", maxsplit=-1, skip=0, tail=True):
    if skip == 0:
        return aStr.split(sep, maxsplit);
    
    tmpList = aStr.split(sep, maxsplit);
    newList = [];
    itmp = skip+1;
    i = -1;
    for i in range(len(tmpList)/(itmp)):
        newList.append(sep.join(tmpList[i*itmp:(i+1)*itmp]));
    if (i+1)*itmp < len(tmpList) and tail:
        newList.append(sep.join(tmpList[(i+1)*itmp:]));
    return newList;

__pickNumPttn = re.compile(r'[^0-9\.]');

def pickNum(aStr):
    newStr = __pickNumPttn.sub('',aStr);
    return newStr.isdigit() and int(newStr) or float(newStr);

def htmlCode2Char(strIn):
    strOut =  strIn.replace('%20', ' ');
    strOut = strOut.replace('%21', '!');
    strOut = strOut.replace('%22', '"');
    strOut = strOut.replace('%23', '#');
    strOut = strOut.replace('%24', '$');
    strOut = strOut.replace('%25', '%');
    strOut = strOut.replace('%26', '&');
    strOut = strOut.replace('%27', '\'');
    strOut = strOut.replace('%28', '(');
    strOut = strOut.replace('%29', ')');
    strOut = strOut.replace('%2a', '*');
    strOut = strOut.replace('%2b', '+');
    strOut = strOut.replace('%2c', ',');
    strOut = strOut.replace('%2d', '-');
    strOut = strOut.replace('%2e', '.');
    strOut = strOut.replace('%2f', '/');
    strOut = strOut.replace('%30', '0');
    strOut = strOut.replace('%31', '1');
    strOut = strOut.replace('%32', '2');
    strOut = strOut.replace('%33', '3');
    strOut = strOut.replace('%34', '4');
    strOut = strOut.replace('%35', '5');
    strOut = strOut.replace('%36', '6');
    strOut = strOut.replace('%37', '7');
    strOut = strOut.replace('%38', '8');
    strOut = strOut.replace('%39', '9');
    strOut = strOut.replace('%3a', ':');
    strOut = strOut.replace('%3b', ';');
    strOut = strOut.replace('%3c', '<');
    strOut = strOut.replace('%3d', '=');
    strOut = strOut.replace('%3e', '>');
    strOut = strOut.replace('%3f', '?');
    strOut = strOut.replace('%40', '@');
    strOut = strOut.replace('%41', 'A');
    strOut = strOut.replace('%42', 'B');
    strOut = strOut.replace('%43', 'C');
    strOut = strOut.replace('%44', 'D');
    strOut = strOut.replace('%45', 'E');
    strOut = strOut.replace('%46', 'F');
    strOut = strOut.replace('%47', 'G');
    strOut = strOut.replace('%48', 'H');
    strOut = strOut.replace('%49', 'I');
    strOut = strOut.replace('%4a', 'J');
    strOut = strOut.replace('%4b', 'K');
    strOut = strOut.replace('%4c', 'L');
    strOut = strOut.replace('%4d', 'M');
    strOut = strOut.replace('%4e', 'N');
    strOut = strOut.replace('%4f', 'O');
    strOut = strOut.replace('%50', 'P');
    strOut = strOut.replace('%51', 'Q');
    strOut = strOut.replace('%52', 'R');
    strOut = strOut.replace('%53', 'S');
    strOut = strOut.replace('%54', 'T');
    strOut = strOut.replace('%55', 'U');
    strOut = strOut.replace('%56', 'V');
    strOut = strOut.replace('%57', 'W');
    strOut = strOut.replace('%58', 'X');
    strOut = strOut.replace('%59', 'Y');
    strOut = strOut.replace('%5a', 'Z');
    strOut = strOut.replace('%5b', '[');
    strOut = strOut.replace('%5c', '\\');
    strOut = strOut.replace('%5d', ']');
    strOut = strOut.replace('%5e', '^');
    strOut = strOut.replace('%5f', '_');
    strOut = strOut.replace('%60', '`');
    strOut = strOut.replace('%61', 'a');
    strOut = strOut.replace('%62', 'b');
    strOut = strOut.replace('%63', 'c');
    strOut = strOut.replace('%64', 'd');
    strOut = strOut.replace('%65', 'e');
    strOut = strOut.replace('%66', 'f');
    strOut = strOut.replace('%67', 'g');
    strOut = strOut.replace('%68', 'h');
    strOut = strOut.replace('%69', 'i');
    strOut = strOut.replace('%6a', 'j');
    strOut = strOut.replace('%6b', 'k');
    strOut = strOut.replace('%6c', 'l');
    strOut = strOut.replace('%6d', 'm');
    strOut = strOut.replace('%6e', 'n');
    strOut = strOut.replace('%6f', 'o');
    strOut = strOut.replace('%70', 'p');
    strOut = strOut.replace('%71', 'q');
    strOut = strOut.replace('%72', 'r');
    strOut = strOut.replace('%73', 's');
    strOut = strOut.replace('%74', 't');
    strOut = strOut.replace('%75', 'u');
    strOut = strOut.replace('%76', 'v');
    strOut = strOut.replace('%77', 'w');
    strOut = strOut.replace('%78', 'x');
    strOut = strOut.replace('%79', 'y');
    strOut = strOut.replace('%7a', 'z');
    strOut = strOut.replace('%7b', '{');
    strOut = strOut.replace('%7c', '|');
    strOut = strOut.replace('%7d', '}');
    strOut = strOut.replace('%7e', '~');
    strOut = strOut.replace('\&quot;', '"');
    strOut = strOut.replace('\&amp;', '&');
    strOut = strOut.replace('\&lt;', '<');
    strOut = strOut.replace('\&gt;', '>');
    return strOut;
