import csv, re, sys, optparse, time
import os.path
from itertools import groupby
from operator import itemgetter

# Constants to be replaced with command line options

def updateStdOut(string):
    sys.stdout.write("%s\r" % (string,))
    sys.stdout.flush()

def main():

    # Command Line parsing
    parser = optparse.OptionParser()
    parser.add_option("-i", "--input", action="append", dest="inputs",
                      help="input FILE", metavar="FILE")
    parser.add_option("-n", "--name", action="append", dest="input_names",
                      help="name for count output", metavar="FILE")
    parser.add_option("-o", "--output", action="store", dest="output",
                      help="output FILE", metavar="FILE")
    parser.add_option("-d", "--decoy", action="store", dest="decoy",
                      help="set max num decoys", default=2)
    parser.add_option("-f", "--fdr", action="store", dest="fdr",
                      help="set fdr", default=0.05)
    parser.add_option("-p", "--pep", action="store", dest="uniq_pep",
                      help="set num uniq pep", default=2)
    
    (options, args) = parser.parse_args()
  
    fileList = options.inputs
    
    outFile = options.output
    decoy = options.decoy
    uniq_pep = options.uniq_pep
    fdr_threshold = options.fdr
    
    
    # Check for required number of file arguments
    if len(fileList) < 2:        
        print "Need 2 or more parsed files for comparison"
        sys.exit(0)
    if not outFile:        
        print "Output file not specified ... -o FILE"
        sys.exit(0)

    if options.inputs:
        input_names = []
    else: 
        input_names = options.input_names
    
    if len(input_names) == 0:
        print "Input filenames will be used to for final spectral count headers"   
    elif len(input_names) != len(fileList):
        print "The number and order of input names does not match input filenames"
        sys.exit(0)

        
    dataDict = {}

    
    hitPttn = re.compile(r'^hit(\d+)\.(\d+)$');
    
    #Create Data Dictionary
    #fileList = sys.argv[1:]
    
    #Read and Parse Each File into the Dictionary
    updateStdOut("\nParsing protein lists\n")
    for file in fileList:
        csvFile = open(file, 'r')
        updateStdOut("processing file %s" % (file))
        header = csvFile.readline().rstrip("\n\r").split(',')
           
        descIndex = header.index('Description')
        numPeptidesIndex = header.index('# of Peptides Identified')
        numSpectraIndex = header.index('# of Spectral Matches')
        proteinScoreIndex = header.index('Protein Score')
        proteinPpIndex = header.index('Protein pp')
        sequenceCoverageIndex = header.index('Sequence Coverage')
        sequenceTagCoverageIndex = header.index('Sequence Tag Coverage')
        hitIndex = header.index('Protein Hit #')
        
    
        dataDict['header'] = header
    
        # Parse each line
        for line in csvFile:
            
            data = line.rstrip("\n\r").split(',')
            
            giData = data[descIndex]
            giKey = giData
                
            if giKey in dataDict.keys():
                dataDict[giKey][file]= data
            else: 
                dataDict[giKey] = {}
                dataDict[giKey][file] = data
                dataDict[giKey]['description'] = giData
                
            
        csvFile.close()
    
    # For each key determine the protein groupings
    # Each protein will belong to a single group based on the combined search results
    
    # Initially determine the hit group for each entry
    updateStdOut("\nDetermining protein groups\n")
    countergi = 0
    datadict_len = len(dataDict)
    groupDict= {}
    for gi,data in dataDict.items():
        countergi = countergi+1
        updateStdOut("Processing %d of %d protein groups" % (countergi,datadict_len))
        if gi == 'header':
            continue
        
        group_hits = []
        for file in fileList:
            if file in dataDict[gi].keys():
                
                hit_search = hitPttn.search(dataDict[gi][file][hitIndex]);
                
                if hit_search:
                    hit_group, hit_index = hit_search.groups()      
                    group_hits.append(int(hit_group))
            else:
                group_hits.append(0)
                                                
        dataDict[gi]['group'] = '_'.join(str(x) for x in group_hits)


    data_matrix = []
  
    data_matrix.append(['group'])

    for file in fileList:
        data_matrix[0].extend([file + " hit" , file + " #spectra" , \
                               file + " #peptides" ,file + " Protein Score", \
                               file + " Protein pp", file + " SeqTag Coverage", file + " Seq Coverage"])

             
                           
    data_matrix[0].extend(["Total Spectra", "Max Peptides", "Seq Tag Coverage", \
                           "Sequence Coverage",  "Total Score", \
                           "Max Score", "Description"])  

    updateStdOut("\nCreating Grouped Protein Lists\n")
                           
    for gi,data in dataDict.items(): 
        
        if gi == 'header':
            continue
        
        tmp_list = []
          
        #print gi,data
            
        tmp_list.append (dataDict[gi]['group'])   
        
        totalSpectra = 0
        totalScore = 0
        maxScore = 0
        maxPeptides = 0
        maxSeqCoverage = 0
        maxSeqTagCoverage = 0
        
        for file in fileList:
            if file in dataDict[gi].keys():
                tmp_list.extend([dataDict[gi][file][hitIndex],  \
                                dataDict[gi][file][numSpectraIndex],  \
                                dataDict[gi][file][numPeptidesIndex], \
                                dataDict[gi][file][proteinScoreIndex] ,  \
                                dataDict[gi][file][proteinPpIndex] ,  \
                                dataDict[gi][file][sequenceTagCoverageIndex] , \
                                dataDict[gi][file][sequenceCoverageIndex] ] )
                
                      
                totalSpectra = totalSpectra + float(dataDict[gi][file][numSpectraIndex])
                totalScore = totalScore + float(dataDict[gi][file][proteinScoreIndex])
                SeqTagCoverageSearch = re.search('(\d{1,3})%',dataDict[gi][file][sequenceTagCoverageIndex])
                tmpSeqTagCoverage = SeqTagCoverageSearch.group(1)
                SeqCoverageSearch = re.search('(\d{1,3})%',dataDict[gi][file][sequenceCoverageIndex])
                tmpSeqCoverage = SeqCoverageSearch.group(1)
                                
                if float(dataDict[gi][file][proteinScoreIndex]) > maxScore:
                    maxScore = float(dataDict[gi][file][proteinScoreIndex]) 
                if float(dataDict[gi][file][numPeptidesIndex]) > maxPeptides:
                    maxPeptides = float(dataDict[gi][file][numPeptidesIndex]) 
                if float(tmpSeqCoverage) > maxSeqCoverage:
                    maxSeqCoverage = float(tmpSeqCoverage) 
                if float(tmpSeqTagCoverage) > maxSeqTagCoverage:
                    maxSeqTagCoverage = float(tmpSeqTagCoverage) 
                
            else:
                tmp_list.extend(["-", "0", "0", "0", "0", "0%", "0%"])
                  
        tmp_list.extend([totalSpectra, maxPeptides, \
                         str(maxSeqTagCoverage) + "%" , str(maxSeqCoverage) + "%" , \
                         totalScore, maxScore, dataDict[gi]['description'] ])
                         
        
        data_matrix.append(tmp_list)

    
    mxscridx = data_matrix[0].index('Max Score')
    mxpepidx = data_matrix[0].index('Max Peptides')
    descidx = data_matrix[0].index('Description')
    grpidx = data_matrix[0].index('group')

    tmp_data = data_matrix[1:]
    tmp_data.sort(key=lambda x: x[grpidx],reverse=True)
        
    updateStdOut("\nWriting all Protein Groups\n")
    
    
    
    outFile,ext = os.path.splitext(outFile)
    output = open(outFile+ext, 'w')  

    grouped_data = []
    
    for group_id, group_list in groupby(tmp_data, itemgetter(grpidx)):
        
        tmp_group = []
        for item in group_list:
            tmp_group.append(item)
        tmp_group.sort(key=lambda x: (float(x[mxscridx]),float(x[mxpepidx])),reverse=True)
        grp_mx_scr = tmp_group[0][mxscridx]
        grp_mx_pep = tmp_group[0][mxpepidx]
        
        grouped_data.append([group_id, grp_mx_scr, grp_mx_pep, tmp_group])
    
    grouped_data.sort(key=lambda x: (float(x[1]),float(x[2])),reverse=True)
      
    print >> output, " , ".join(str(x) for x in data_matrix[0])
    
    for group_items in grouped_data:
        for data in group_items[3]:
            print >> output, " , ".join(str(x) for x in data)
            
    output.close()    


    output = open(outFile+"_top"+ext, 'w')  

    print >> output, " , ".join(str(x) for x in data_matrix[0])
    
    for group_items in grouped_data:
        print >> output, " , ".join(str(x) for x in group_items[3][0])

    output.close()

    output = open(outFile+"_top"+ext, 'w')  

    print >> output, " , ".join(str(x) for x in data_matrix[0])
    
    for group_items in grouped_data:
        print >> output, " , ".join(str(x) for x in group_items[3][0])

    output.close()
    
    
    
    # Output a list of protein ID and spectral counts based on 
    # number of unique peptides, number of decoys and FDR
    
    updateStdOut("\nWriting Spectral Count Table\n")
    
    # Output in csv and tab delmited
    
    output = open(outFile+"_scounts.csv", 'w')  
    td_output = open(outFile+"_scounts.txt", 'w')  
    
    # Find columns that contain spectral counts
    # this is setup for massmatrix only at this time
    
    spectraidx = []
    
    for i in range(0,len(data_matrix[0])):
        if data_matrix[0][i].find("#spectra") > 0:
            spectraidx.append(i)
    print "spectra counts found in columns = ", " , ".join(str(x) for x in spectraidx)
    
    # Trim filename labels in the header
    
    tmp_string = data_matrix[0][descidx].strip()
    td_tmp_string = data_matrix[0][descidx].strip()
    
    if len(input_names) == 0:
        for idx in spectraidx:
            tmp_string = tmp_string + "," + data_matrix[0][idx][0:data_matrix[0][idx].find('_prot')].strip()
            td_tmp_string = td_tmp_string + "\t" + data_matrix[0][idx][0:data_matrix[0][idx].find('_prot')].strip()
    else:
        for name in input_names:
            tmp_string = tmp_string + "," + name.strip()
            td_tmp_string = td_tmp_string + "\t" +  name.strip()
            
    print >> output, tmp_string            
    print >> td_output, td_tmp_string
        
    decoy_num = 0.0
    protein_num = 0.0
    fdr = 0.0
    fdr_threshold_score = 0.0
    fdr_threshold = 0.05
    
    # Parse data and output spectral count tables
    
    for group_items in grouped_data:
                
        tmp_mxscr = group_items[3][0][mxscridx]
        #print tmp_mxscr
        if group_items[3][0][descidx].find("DECOY") > 0.0:
                decoy_num = decoy_num + 1     
                #print "Decoy found ", decoy_num, protein_num   
                
                try:
                    fdr =  (2.0 * decoy_num) / protein_num
                    #print fdr
                    if fdr >= fdr_threshold:
                        fdr_threshold_score = tmp_mxscr
                except:
                    pass
                    #print "Unexpected error or not proteins above FDR"
                        
        #print protein_num, decoy, decoy_num, fdr, fdr_threshold_score, tmp_mxscr
                
        if (decoy_num >= decoy or tmp_mxscr < fdr_threshold_score):  
            break
        else:
            tmp_string = group_items[3][0][descidx].strip()
            td_tmp_string = group_items[3][0][descidx].strip()
            if float(group_items[3][0][mxpepidx]) >= uniq_pep:
                
                for idx in spectraidx:
                    tmp_string = tmp_string + "," + group_items[3][0][idx].strip()
                    td_tmp_string = td_tmp_string + "\t" + group_items[3][0][idx].strip()
                print >> output, tmp_string    
                print >> td_output, td_tmp_string          
                protein_num = protein_num + 1

    output.close()
    td_output.close()


    output = open(outFile+"_param"+ext, 'w')  
    
    print >> output, "mm_group_data.py"
    print >> output, "Version = 0.1"
    print >> output, "--------------------"
    print >> output, "Input Files: ", ",".join(fileList)   
    print >> output, "Input Names: ", ",".join(input_names)   
    print >> output, "Output File = ", outFile    
    print >> output, "Max Decoys = ", decoy
    print >> output, "FDR = ", fdr_threshold
    print >> output, "Unique Peptides = ", uniq_pep    
    print >> output, "--------------------"
    print >> output, "Number of Protein Groups = ", protein_num
    print >> output, "Number of Decoys = ", decoy_num
    print >> output, "FDR Estimate = ", fdr
    print >> output, "FDR Threshold Score = ", fdr_threshold_score

    output.close()
    

if __name__ == "__main__":
    # Import Psyco if available
    try:
        import psyco
        psyco.full()
    except ImportError:
        print "psyco import failed"
        pass
    
    start = time.time()

    main()
    
    elapsed = time.time()                                  
    print "Code completed in %f seconds" % (elapsed - start)
    
    sys.exit(0)
