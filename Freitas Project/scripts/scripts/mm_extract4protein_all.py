import sys, re, os, string
from HXPyTools import *

def main():
    if len(sys.argv) != 2:
        print framedTxt("Usage:");
        print "mm_extract4protein MassMatrix-main-html-file";
        sysWaitThenExit(0);
    
    mmFile = findAFile(sys.argv[1]);
    if not mmFile:
        print "The specified file could be found!";
        print "Please check then try it again.";
        sysWaitThenExit(0);
    
    hitFilePttn = re.compile(r'^hit(\d+)\.html$');
    groupFilePttn = re.compile(r'^group(\d+)\.html$');
    memberTagPttn = re.compile(r'member(\d+)');
    memberEndTagPttn = re.compile(r'_____________________________')
    htmlTagPttn = re.compile(r'<.*?>');
    massPttn = re.compile(r'Protein Mass:\s*([\.\d]+)\s*\(monoisotopic\)\s*([\.\d]+)\s*\(average\)');
    scorePttn = re.compile(r'Protein Score:\s*(\d+)');
    scorePPPttn = re.compile(r'Protein pp:\s*(\d+)');
    seqCovPttn =re.compile(r'Sequence Coverage:\s*([\d%]+)');
    tagCovPttn =re.compile(r'Sequence Tag Coverage:\s*([\d%]+)');
    pttn1 = re.compile(r'Index\s+scan#\s+charge\s+score', re.IGNORECASE);
    peptidePttn = re.compile(r'<a href=')
    
    
    # New Code for TMT
    #New search patterns used in TMT code
    tablePttn = re.compile(r'</table>')
    ratioPttn = re.compile(r'>([\.\d]+)<')
       
    tmtPttn = []
    
    #Should overide this list from a string supplied at the command line
    TMTs = [126,127,128,129,130,131]
    tmtHeader = ''

    #Creates TMT searches and TMT Header from list above
    for tmt in TMTs:
        tmtPttn.append(re.compile(r'>\s*(%s)\s*<' % tmt))
        tmtHeader = ",".join((tmtHeader,str(tmt)))

    tmtHeader = tmtHeader[1:]    
    
    
    mmDir = changeExt(mmFile, "_files");
    mmDirList = os.listdir(mmDir)
    hitFileList = filter(hitFilePttn.search, mmDirList);
    groupFileList = filter(groupFilePttn.search, mmDirList);

    protInfoDict = {};
    
    for hitFile in hitFileList:
        
        hitNumber = hitFilePttn.search(hitFile).groups()[0]
        groupFile = "group" + str(hitNumber) + ".html"
        if groupFile in groupFileList:
            group_flag = 1
            group_tag = hitNumber
            fin = open(os.path.join(mmDir, groupFile), 'rt')
            tline = fin.readline().strip()
            
            while tline:
                member_grps = memberTagPttn.search(tline)
                if member_grps:
                    score = seqCov = tagCov = monoMass = avgMass = desc = "N/A or Not Extracted"
                    memberID = member_grps.groups()[0]
                                         
                    nPeptide = 0;
                    nSpecMatch = 0;
                    flag = 0
                    flag2 = 0
                    
                    while tline:  
                        
                                               
                        if flag == 1:
                        #all peptides identified for the protein
                            if '<a href=' in tline:
                                nSpecMatch += 1;
                                flag2 = 1;
                                flag = 1;
                            elif flag2:
                                nPeptide += 1;
                                flag2 = 0
                                                      
                        else:    
                            
                            tline = htmlTagPttn.sub('', tline);                  
                            
                            m1 = massPttn.search(tline)
                            m2 = scorePttn.search(tline)
                            m2b = scorePPPttn.search(tline)
                            m3 = seqCovPttn.search(tline)
                            m4 = tagCovPttn.search(tline)
                            
                            if m1:
                                (monoMass, avgMass) = m1.groups();
                            if m2:
                                score = m2.groups()[0]
                                pp = m2b.groups()[0]
                                desc = fin.readline().strip()
                                desc = string.replace(desc,",",";")
                            if m3:
                                seqCov = m3.groups()[0];
                            if m4:
                                tagCov = m4.groups()[0]; 
                                flag = 1   
                                
                        member_end = memberEndTagPttn.search(tline)
                        
                        if member_end:
                            outStr = ",".join((str("%s.%s" % (hitFile[:-5],memberID)),\
                               score,\
                               pp, \
                               seqCov,\
                               tagCov,\
                               monoMass,\
                               avgMass,\
                               str(nPeptide),\
                               str(nSpecMatch),\
                               ",,,,,",
                               desc,\
                               ""
                              ));
                         
  
                            protInfoDict[str("%s.%s" % (hitFile[3:-5],memberID))] = outStr;
                            

                            break
                            
                        else:
                            tline = fin.readline()
                            
                            
                else:
                    try:
                        tline = fin.readline().strip()
                        
                    except:
                        break
                        fin.close();
                        group_flag = 0
        
    
        else:
            fin = open(os.path.join(mmDir, hitFile), 'rt');
            group_flag = 0
      
        
            flag = 0;#0, protein info, 1, peptide info, 2, grouped protein info
            flag2 = 0;#0, outside a peptide block, 1, inside a peptide block
            flag3 = 0;#0, protein match info, 1, protein desc
            score = seqCov = tagCov = monoMass = avgMass = desc = "N/A or Not Extracted";
            nPeptide = 0;
            nSpecMatch = 0;
            
#            groupedProt = [];
            for tline in fin:
                tline = tline.strip();
                
                if flag == 1:
                    #all peptides identified for the protein
                    if '<a href="' in tline:
                        nSpecMatch += 1;
                        flag2 = 1;
                    elif flag2:
                        nPeptide += 1;
                        flag2 = 0;
                else:
                    tline = htmlTagPttn.sub('', tline);
                    if flag == 0:
                        #protein hit info
                        if flag3 and len(tline) > 2:
                            #desc = quote(tline);
                            desc = tline;
                            desc = string.replace(desc,",",";")
                            flag3 = 0;
                        
                        m1 = massPttn.search(tline);
                        if m1:
                            (monoMass, avgMass) = m1.groups();
                            m2 = scorePttn.search(tline);
                            m2b = scorePPPttn.search(tline);
                            flag3 = 1;
                            if m2:
                                score = m2.groups()[0];
                            if m2b:
                                pp = m2b.groups()[0]
                                
                        else:
                            m3 = seqCovPttn.search(tline);
                            if m3:
                                seqCov = m3.groups()[0];
                            else:
                                m4 = tagCovPttn.search(tline);
                                if m4: tagCov = m4.groups()[0];
    #                elif len(tline) > 2 and (tline[0] not in ['_',' ']):
    #                   #all other proteins with similar peptides identified
    #                   groupedProt.append(quote(tline.replace(',',' ')));
                
                if pttn1.search(tline): flag = 1;
                if "all possible proteins having" in tline: flag = 2;
            fin.close();
            
            #Parse TMT Quantitation if exists
            src,src_ext = os.path.splitext(hitFile)
            try:
                fin = open(os.path.join(mmDir, src + "_quant" + src_ext), 'rt');
                tline = fin.readline()
            
                ratioOutput = []
                ratioMatchOutput = []
            
                while tline:
                
                    for pttn in tmtPttn:
                        ratioMatch = pttn.search(tline);
                    
                        if ratioMatch:
                            ratio_match_tmp = ratioMatch.groups()[0]
                            ratioMatchOutput.append(ratio_match_tmp)
                            tline = fin.readline()
                            tline = fin.readline()
                            rgrp = ratioPttn.search(tline)
                            if rgrp:
                                ratio_tmp = rgrp.groups()[0]
                                ratioOutput.append(ratio_tmp)
                            else:
                                ratioOutput.append(0)
                                                
                    tline = fin.readline()
                    if tablePttn.search(tline):
                        break
                                    
                fin.close();

                #Formats TMT string.  This code checks to make sure TMT matches are presented in the correct order
                #This code may be redundant but it insures that TMTs are supplied in the correct column
                tmtString = ''
            
                for tmt in TMTs:
                    index = ratioMatchOutput.index(str(tmt))     
                    tmtString = ",".join((tmtString,str(ratioOutput[index])))

                tmtString = tmtString[1:]         
     
            except:
                tmtString = ",,,,,"

            #out protein hit info
            outStr = ",".join((str("%s.0" % hitFile[:-5]),\
                               score,\
                               pp,\
                               seqCov,\
                               tagCov,\
                               monoMass,\
                               avgMass,\
                               str(nPeptide),\
                               str(nSpecMatch),\
                               tmtString,
                               desc,\
                               ""
                              ));
                         
    #        outStr += groupedProt and ",".join(groupedProt) or "None";
            protInfoDict[str("%s.0" % hitFile[3:-5])] = outStr;
    
    
    hitNoList = protInfoDict.keys();
    hitNoList.sort();
    
    outFile = changeExt(mmFile, "_prot.csv");
    fout = open(outFile, 'wt');
    print >>fout, ",".join(("Protein Hit #", "Protein Score", "Protein pp", "Sequence Coverage",\
                             "Sequence Tag Coverage", "Mass (Monoisotopic)", "Mass (Average)",\
                             "# of Peptides Identified", "# of Spectral Matches", tmtHeader, \
#                             "Description","Other Proteins with Similar Peptides Identified"\
                             "Description",));
    
    for i in hitNoList: 
        
        print >>fout, protInfoDict[i];
        
    fout.close();
    

if __name__ == "__main__":
    main();
