#! /usr/bin/Rscript --vanilla --default-packages=base,datasets,utils,stats,edgeR,grDevices,graphics

library(edgeR)

args <- commandArgs(TRUE)

if (length(args) < 5) 

    {
        cat("\nERROR: Insufficient command line arguments. 5 arguments required\n\n")
        cat("edgeR_single_factor datafile c1 g1 c2 g2\n\n")
        cat("  datafile = CSV file: sample IDs in row 1, protein IDs in column 1.\n")
        cat("             Samples grouped by treatment.\n")
        cat("  c1 = first column for treatment group 1\n")
        cat("  g1 = number of treatment in treatment group 1\n")
        cat("  c2 = first column for treatment group 2\n")
        cat("  g2 = number of treatment in treatment group 2\n")
        quit()
    }

#Parse Command Line Arguments
filename <- args[1]
c1 <- as.numeric(args[2])
g1 <- as.numeric(args[3])
c2 <- as.numeric(args[4])
g2 <- as.numeric(args[5])

#Read Data from formatted CSV file
datafile <- read.csv(file=filename, head = TRUE)
datafile.counts = cbind(datafile[, c1:(c1+g1-1)],datafile[, c2:(c2+g2-1)])
datafile.genes = datafile[, 1]

#create vector with labels for each sample group ID
#create DGEList 
datafile.dgelist <- DGEList(counts=datafile.counts, group=c(rep(0,g1),rep(1,g2)), genes = datafile.genes)

#filter data such that a rom must have = 5 counts
#cat(paste("\nProteins before filetering = ",dim(datafile.dgelist),"\n"))
datafile.dgelist <- datafile.dgelist[rowSums(datafile.dgelist$counts) >= 5, ]
#cat(paste("Proteins after filetering = ",dim(datafile.dgelist),"\n"))

#Normalize data
cat("Normalizing data\n")
datafile.dgelist <- calcNormFactors(datafile.dgelist)
#datafile.dgelist$samples

#Estimate Common Dispersion
datafile.dgelist <- estimateCommonDisp(datafile.dgelist)
#datafile.dgelist$samples$lib.size
#datafile.dgelist$common.lib.size
cat(paste("common dispersion =", datafile.dgelist$common.dispersion,"\n"))

#create MDS plot
MDSPDFfile <- paste(filename,date(),"MDS.pdf")
pdf(file=MDSPDFfile)
plotMDS(datafile.dgelist, main="MDS Plot")
dev.off()

#perform exact test to determine proteins differentially experessed
datafile.dgelist.results <- exactTest(datafile.dgelist)

#format taks for SMEAR MVA plot
options(digits = 4)
#topTags(datafile.dgelist.results )

#perform multiple comparison correction
BH.mt.adj <- decideTestsDGE(datafile.dgelist.results , adjust.method="BH", p.value=0.05)
#BH.mt.adj

#create SMEAR plot
top <- topTags(datafile.dgelist.results , n = sum(datafile.dgelist.results $table$PValue < 0.05))
detags <- rownames(top$table)
smearPDFfile <- paste(filename,date(),"smear.pdf")
pdf(file=smearPDFfile )
plotSmear(datafile.dgelist.results , de.tags = detags, main = "FC Smear Plot",cex=0.5)
abline(h = c(-1, 1), col = "dodgerblue")
dev.off()

#format final results for output
final_results = cbind(datafile.dgelist$counts,datafile.dgelist.results$table,BH.mt.adj)
rownames(final_results) <- datafile.dgelist.results$genes[,1]
final_results.mtcorrected = final_results[final_results$BH.mt.adj != 0 , ]

#Create MV plot
MVPDFfile <- paste(filename,date(),"mv.pdf")
pdf(file=MVPDFfile )
plotMeanVar(datafile.dgelist)
dev.off()

#output final results
outfile = paste(filename,date(),".csv")
write.table(final_results[order(final_results$PValue) ,] , file=outfile,sep=",")

#create Heatmap for top protein IDs
head(as.matrix(final_results.mtcorrected[, 1:(g1+g2)]))
HMPDFfile <- paste(filename,date(),"HM.pdf")
pdf(file=HMPDFfile )
heatmap(as.matrix(final_results.mtcorrected[, 1:(g1+g2)]))
abline(h = c(-1, 1), col = "dodgerblue")
dev.off()
