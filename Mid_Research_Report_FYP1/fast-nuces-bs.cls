%
% FAST-NUCES BS-FYP Thesis Class v0.4
% By Omar Usman Khan <omar.khan@nu.edu.pk>
%
% Version History
% 0.1 2018-01-29
% 0.2 2018-02-27 UML support + some house-keeping
% 0.3 2018-05-21 Fixing header stuff and 3/4 author issues
% 0.4 2025-01-XX Fixed spacing and empty page issues

\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{fast-nuces-bs}[2025/01/01 v0.4 FAST-NUCES-BS FYP Thesis Class]

\DeclareOption*{\PassOptionsToClass{\CurrentOption}{book}}
\ProcessOptions\relax
\LoadClass[12pt, a4paper, openany]{book}


\RequirePackage{amssymb, amsmath, amsthm, amstext}
\RequirePackage{tikz}
\RequirePackage{tocloft}
\RequirePackage[sort, numbers, authoryear]{natbib}
\RequirePackage{emptypage}
\RequirePackage{graphics}
\RequirePackage{graphicx}
\RequirePackage{fancyhdr}
\RequirePackage{eucal}
\RequirePackage{soul}
\RequirePackage[english]{babel}
%\RequirePackage[usenames, dvipsnames]{color}
\RequirePackage{etoolbox}
\RequirePackage[perpage]{footmisc}
\RequirePackage{ifthen}
\RequirePackage{ifpdf}
\RequirePackage[utf8]{inputenc}
\RequirePackage{epsfig}
\RequirePackage{setspace} 
\RequirePackage[lmargin=3cm,rmargin=3cm,
				tmargin=2.5cm,bmargin=2.5cm,
				includefoot]{geometry}
\RequirePackage[bookmarks,
                bookmarksopen = true,
                bookmarksnumbered = true,
                breaklinks = true,
                linktocpage,
                pagebackref = false,
                ocgcolorlinks,
				colorlinks = true,
                linkcolor = blue,
                urlcolor  = blue,
                citecolor = red,
                anchorcolor = green,
                hyperindex = true,
                hyperfigures
                ]{hyperref}

% Additional packages for spacing control
\RequirePackage{enumitem}
\RequirePackage{titlesec}
\RequirePackage{caption}

% DELETE
%\RequirePackage{showframe}
% END DELETE

%Bibliography
\renewcommand{\bibname}{References}

%%%%%%%%%%%%%%%%%% General Settings
\linespread{1.15}
\setlength{\parindent}{0cm}
\setlength{\parskip}{0.5em}
\setcounter{secnumdepth}{3} % For TOC
\setcounter{tocdepth}{3}
\pdfcompresslevel=9
\DeclareGraphicsExtensions{.png, .jpg, .jpeg, .pdf, .eps, .ps}

%%%%%%%%%%%%%%%%%% Spacing Control Settings
% Reduce list spacing
\setlist{nosep, topsep=6pt, parsep=0pt, partopsep=0pt, itemsep=3pt}

% Control float spacing
\setlength{\floatsep}{10pt plus 2pt minus 2pt}
\setlength{\textfloatsep}{15pt plus 2pt minus 4pt}
\setlength{\intextsep}{10pt plus 2pt minus 2pt}

% Caption spacing
\captionsetup{
  font=small,
  labelfont=bf,
  skip=8pt,
  aboveskip=8pt,
  belowskip=4pt
}

% Chapter formatting with reduced spacing
\titleformat{\chapter}[display]
  {\normalfont\huge\bfseries}{\chaptertitlename\ \thechapter}{20pt}{\Huge}
\titlespacing*{\chapter}{0pt}{0pt}{30pt}

% Section spacing
\titlespacing*{\section}{0pt}{12pt plus 4pt minus 2pt}{6pt plus 2pt minus 2pt}
\titlespacing*{\subsection}{0pt}{10pt plus 4pt minus 2pt}{4pt plus 2pt minus 2pt}
\titlespacing*{\subsubsection}{0pt}{8pt plus 4pt minus 2pt}{4pt plus 2pt minus 2pt}

%%%%%%%%%%%%%%%%%%
%%%%%%%%%%%%%%%%%%
\newcommand{\yellow}[1]{\hl{#1}}
\newcommand{\comments}[1]{} 
%%%%%%%%%%%%%%%%%%
\AfterEndPreamble{\maketitle}
%%%%%%%%%%%%%%%%%%

\pagestyle{fancy}
\renewcommand{\chaptermark}[1]{\markboth{\thechapter. #1 }{}}
\renewcommand{\sectionmark}[1]{\markright{\thesection\ #1}}
\fancyhf{}
\fancyhead[RO]{\footnotesize\rightmark}
\fancyhead[LE]{\footnotesize\leftmark}
\fancyfoot[C]{\thepage}
\fancypagestyle{plain}{
  \fancyhead{}
  \renewcommand{\headrulewidth}{0pt}
}

\newcommand{\submittedtext}{{A thesis submitted for the degree of}}

% Chapter head formatting - already handled by titlesec above
% Keeping this as fallback/compatibility
\renewcommand{\@makechapterhead}[1]{%
  \vspace*{30\p@}%
  {\parindent \z@ \raggedright \normalfont
    \vspace{5pt}%
    \ifnum \c@secnumdepth >\m@ne
        \Large\bfseries\scshape \@chapapp\space \thechapter
        \par\nobreak
        \vskip 15\p@
    \fi
    \interlinepenalty\@M
    \Huge\bfseries \scshape #1\par
    \nobreak
    \vskip 30\p@
  }}

% DECLARATIONS
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% The Roll Number of Student
\def\rollnumber#1{\gdef\@rollnumber{#1}}
% The year and term the degree will be officially conferred
\def\degreeyear#1{\gdef\@degreeyear{#1}}
\def\degreemonth#1{\gdef\@degreemonth{#1}}
% The full (unabbreviated) name of the degree
\def\degree#1{\gdef\@degree{#1}}
% The name of your college or department
\def\department#1{\gdef\@department{#1}}
\def\faculty#1{\gdef\@faculty{#1}}
% The name of your University
\def\university#1{\gdef\@university{#1}}
% Defining the crest
\def\crest#1{\gdef\@crest{#1}}
% Supervisor Name
\def\supervisor#1{\gdef\@supervisor{#1}}
\def\cosupervisor#1{\gdef\@cosupervisor{#1}}
\def\sessionduration#1{\gdef\@sessionduration{#1}}
% Author Names
\def\authorone#1#2{
	\gdef\@authoronename{#1}
	\gdef\@authoroneroll{#2}
}
\def\authortwo#1#2{
	\gdef\@authortwoname{#1}
	\gdef\@authortworoll{#2}
}
\def\authorthree#1#2{
	\gdef\@authorthreename{#1}
	\gdef\@authorthreeroll{#2}
}
\def\authorfour#1#2{
	\gdef\@authorfourname{#1}
	\gdef\@authorfourroll{#2}
}
% Degree Name
\def\degreename#1{\gdef\@degreename{#1}}
% Campus City
\def\campuscity#1{\gdef\@campuscity{#1}}
% Committee Examination Names
\def\internalexaminer#1{\gdef\@internalexaminer{#1}}
\def\externalexaminer#1#2{\gdef\@externalexaminer{#1\par\hspace{0cm}#2}}
% Dean Names
\def\deanname#1{\gdef\@deanname{#1}}
% Director Name
\def\directorname#1{\gdef\@directorname{#1}}
% HoD Name
\def\hodname#1{\gdef\@hodname{#1}}
% GPC Coordinator Name
\def\fypcoordinatorname#1{\gdef\@fypcoordinatorname{#1}}
% Acknowledgement Text
\def\acknowledge#1{\gdef\@acknowledge{#1}}

%%%%%%%%%%%%%%%%%%%%%%%%%
% Some Important Environments
\newenvironment{alwayssingle}{%
       \@restonecolfalse\if@twocolumn\@restonecoltrue\onecolumn
       \else\newpage\fi}
       {\if@restonecol\twocolumn\else\newpage\fi}

\renewcommand{\maketitle}{%
\begin{alwayssingle}
	\renewcommand{\footnotesize}{\small}
    \renewcommand{\footnoterule}{\relax}
    \thispagestyle{empty}
	
	% -----------------------------
	% TITLE PAGE CONTENT
	% -----------------------------
	\begin{center}
		{\setstretch{1.1}
		
		% ---- Title ----
		\par{\fontsize{24}{24}\selectfont \textbf{\@title}}\par
		\vspace{1cm}
		
		% ---- Project Team ----
		\par{\fontsize{14}{14}\selectfont Project Team}\\[0.3cm]
		{\fontsize{19}{19}\selectfont
		\begin{tabular}{lr}
			\ifx\@authoronename\undefined ~ \else \@authoronename \fi  & 
			\ifx\@authoroneroll\undefined ~ \else \@authoroneroll \fi \\
			\ifx\@authortwoname\undefined ~ \else \@authortwoname \fi  & 
			\ifx\@authortworoll\undefined ~ \else \@authortworoll \fi \\
			\ifx\@authorthreename\undefined ~ \else \@authorthreename \fi  & 
			\ifx\@authorthreeroll\undefined ~ \else \@authorthreeroll \fi \\
			\ifx\@authorfourname\undefined ~ \else \@authorfourname \fi  & 
			\ifx\@authorfourroll\undefined ~ \else \@authorfourroll \fi
		\end{tabular}
		}\par
		
		\vspace{0.4cm}
		\par{\fontsize{16}{16}\selectfont Session \@sessionduration}\par
		
		% ---- Supervisor(s) ----
		\vspace{0.7cm}
		\ifx\@cosupervisor\undefined
			\par{\fontsize{14}{14}\selectfont Supervised by}\\[0.3cm]
			{\fontsize{19}{19}\selectfont \@supervisor}\par
		\else
			\par{\fontsize{14}{14}\selectfont Supervised by}\\[0.3cm]
			{\fontsize{19}{19}\selectfont \@supervisor}\par
			\vspace{0.4cm}
			\par{\fontsize{14}{14}\selectfont Co-Supervised by}\\[0.3cm]
			{\fontsize{19}{19}\selectfont \@cosupervisor}\par
		\fi
		
		% ---- Push Remaining to Bottom ----
		\vfill
		
		% ---- Logo ----
		\begin{figure}[h]\centering
			\includegraphics[width=.28\columnwidth]{ThesisFigs/FASTLogo}
		\end{figure}
		
		\vspace{0.3cm}
		
		% ---- Department + University ----
		\par{\fontsize{17}{17}\selectfont \textbf{\@department}}\par
		\vspace{0.2cm}
		\par{\fontsize{17}{17}\selectfont \textbf{National University of
		Computer and Emerging Sciences\\\@campuscity, Pakistan}}\par
		
		\vspace{0.4cm}
		% ---- Horizontal Line + Date ----
		\rule{0.99\textwidth}{0.4pt}\\[0.3cm]
		\par{\fontsize{17}{17}\selectfont \textbf{\@degreemonth, \@degreeyear}}\par
		}
	\end{center}
	
	% REMOVED: \null\vfill and extra \clearpage
	\clearpage
	
	% -----------------------------
	% TABLES AND CONTENT LISTS
	% -----------------------------
	\pagenumbering{arabic}
	\setcounter{page}{1}
	\tableofcontents
	\clearpage
	\listoffigures
	\clearpage
	\listoftables
	\clearpage
\end{alwayssingle}
}