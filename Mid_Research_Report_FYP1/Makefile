FILENAME=thesis

LATEX=pdflatex
LATEXOPT=--shell-escape
NONSTOP=--interaction=nonstopmode #batchmode

LATEXMK=latexmk
LATEXMKOPT=-pdf
CONTINUOUS=-pvc

NOMENCL=$(shell locate -i nomencl.ist)

all: ${FILENAME}.pdf

${FILENAME}.pdf: ${FILENAME}.tex
	$(LATEXMK) $(LATEXMKOPT) $(CONTINUOUS) -pdflatex="$(LATEX) $(LATEXOPT) $(NONSTOP) %O %S" $(FILENAME).tex
	#latexmk -quiet -pdfps ${FILENAME} 					# No pygmentize
	#latexmk -r Makefile.rc -quiet -pdfps ${FILENAME} 	# pygmentize
	#latexmk -r Makefile.rc -quiet -pdflatex="pdflatex --shell-escape %O %S" ${FILENAME}

nomencl:
	makeindex -s ${NOMENCL} -o ${FILENAME}.nls ${FILENAME}.nlo

clean:
	latexmk -c ${FILENAME}

distclean:
	latexmk -C ${FILENAME}
	rm -rf $(FILENAME).pdfsync
	find . -type f -name '*~' -delete	
	find . -type f -name '*.tmp' -delete	
	find . -type f -name '*.bbl' -delete	
	find . -type f -name '*.synctex.gz' -delete
	find . -type f -name '*.snm' -delete	
	find . -type f -name '*.nav' -delete	
	find . -type f -name '*.aux' -delete	
	find . -type f -name '*.blg' -delete	
	find . -type f -name '*.brf' -delete	
	find . -type f -name '*.end' -delete	
	#find . -type f -name '*.nls' -delete	
	find . -type f -name '*.fls' -delete	
	find . -type f -name '*.log' -delete	
	#find . -type f -name '*.nlo' -delete	
	find . -type f -name '*.out' -delete	
	find . -type f -name '*.texshop' -delete
	find . -type f -name '*.fdb_latexmk' -delete	
	find . -type f -name '*.glo' -delete	
	find . -type f -name '*.synctex.gz' -delete	
	find . -type f -name '*converted-to.pdf' -delete	

debug:
	$(LATEX) $(LATEXOPT) $(FILENAME)

.PHONY: all ${FILENAME}.pdf clean distclean
