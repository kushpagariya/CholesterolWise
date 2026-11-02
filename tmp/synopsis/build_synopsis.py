from pathlib import Path
import math, json
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.lib.utils import ImageReader
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
TMP = ROOT / 'tmp' / 'synopsis'
OUT = ROOT / 'output' / 'pdf' / 'CholesterolWise_Mini_Project_Synopsis.pdf'
FONT = TMP / 'liberation-fonts-ttf-2.1.5'
for suffix, filename in [('', 'Regular'), ('-Bold','Bold'), ('-Italic','Italic'), ('-BoldItalic','BoldItalic')]:
    pdfmetrics.registerFont(TTFont('LiberationSerif'+suffix, str(FONT/f'LiberationSerif-{filename}.ttf')))
pdfmetrics.registerFontFamily('LiberationSerif', normal='LiberationSerif', bold='LiberationSerif-Bold', italic='LiberationSerif-Italic', boldItalic='LiberationSerif-BoldItalic')

W,H = 612,792
LEFT,WIDTH = 52,508
styles = {
 'body': ParagraphStyle('body', fontName='LiberationSerif', fontSize=11.5, leading=14.95, alignment=TA_JUSTIFY),
 'left': ParagraphStyle('left', fontName='LiberationSerif', fontSize=11.5, leading=14.95),
 'small': ParagraphStyle('small', fontName='LiberationSerif', fontSize=10.5, leading=13.65),
 'table': ParagraphStyle('table', fontName='LiberationSerif', fontSize=10.5, leading=13.1),
 'ref': ParagraphStyle('ref', fontName='LiberationSerif', fontSize=10, leading=12.6),
 'caption': ParagraphStyle('caption', fontName='LiberationSerif', fontSize=10, leading=13, alignment=TA_CENTER),
 'h2': ParagraphStyle('h2', fontName='LiberationSerif-Bold', fontSize=12.5, leading=16.25),
 'title': ParagraphStyle('title', fontName='LiberationSerif-Bold', fontSize=16, leading=20.8, alignment=TA_CENTER),
}
c = canvas.Canvas(str(OUT), pagesize=(W,H), pageCompression=1)
c.setTitle('CholesterolWise LDL Cholesterol Analyzer - Mini Project Synopsis')
c.setAuthor('Kush Pagariya; Moksh Patel; Reedham Parmar')
c.setSubject('TY B Information Technology - Minor in Fundamentals of Human Physiology and Biomedical Engineering')
page=0
y=0
audit=[]

def start(title=None, chapter=None, bookmark=None):
    global page,y
    if page:
        audit.append({'page':page,'content_bottom':round(y,2)})
        c.showPage()
    page+=1
    c.drawImage(str(TMP/'Im4.jpg'),61.2,690.15,width=489.6,height=80.3)
    c.setStrokeColor(colors.black); c.setLineWidth(.6)
    c.rect(22.3,21.95,567.35,747.75,stroke=1,fill=0)
    c.setFillColor(colors.black); c.setFont('LiberationSerif',11.5)
    c.drawCentredString(306,24.3,str(page))
    y=113.4
    if bookmark:
        c.bookmarkPage(bookmark); c.addOutlineEntry(title or bookmark,bookmark,0)
    if chapter:
        center(f'Chapter {chapter}',12,True,y); y+=26.2
    if title:
        block(title,'title',gap=14)

def center(text,size=12,bold=False,top=None):
    if top is None: top=y
    c.setFont('LiberationSerif-Bold' if bold else 'LiberationSerif',size)
    c.drawCentredString(306,H-top-size*.85,text)

def block(text,style='body',gap=10,x=LEFT,width=WIDTH):
    global y
    p=Paragraph(text,styles[style]); _,h=p.wrap(width,720)
    if y+h>736: raise ValueError(f'Page {page} overflow: {y+h:.1f} in {text[:65]}')
    p.drawOn(c,x,H-y-h); y+=h+gap

def heading(text):
    block(text,'h2',gap=8)

def bullets(items):
    global y
    for text in items:
        block('• '+text,'left',gap=4,x=LEFT+5,width=WIDTH-5)
    y+=5

def table(headers,rows,widths=None,fontsize=None):
    global y
    widths=widths or [WIDTH/len(headers)]*len(headers)
    sty=styles['table']
    if fontsize: sty=ParagraphStyle('ts',parent=sty,fontSize=fontsize,leading=fontsize*1.26)
    data=[[Paragraph('<b>'+escape(str(v))+'</b>',sty) for v in headers]]
    data += [[Paragraph(escape(str(v)).replace('\n','<br/>'),sty) for v in row] for row in rows]
    t=Table(data,colWidths=widths,hAlign='LEFT')
    t.setStyle(TableStyle([('GRID',(0,0),(-1,-1),.5,colors.black),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
    _,h=t.wrap(WIDTH,700)
    if y+h>736: raise ValueError(f'Page {page} table overflow {y+h}')
    t.drawOn(c,LEFT,H-y-h); y+=h+13

def caption(t): block(t,'caption',gap=12)

def screenshot(filename,width=508,maxheight=450):
    global y
    im=Image.open(ROOT/filename); h=width*im.height/im.width
    if h>maxheight: width*=maxheight/h; h=maxheight
    c.drawImage(str(ROOT/filename),LEFT+(WIDTH-width)/2,H-y-h,width=width,height=h)
    c.setLineWidth(.4); c.setStrokeColor(colors.HexColor('#777777'))
    c.rect(LEFT+(WIDTH-width)/2,H-y-h,width,h,fill=0,stroke=1)
    c.setStrokeColor(colors.black); y+=h+8

def diagram(kind):
    global y
    base=y
    def box(x,t,w,h,txt,fill='#f3f5f7',bold=False):
        c.setFillColor(colors.HexColor(fill)); c.setStrokeColor(colors.HexColor('#334155'));c.setLineWidth(.75)
        c.roundRect(LEFT+x,H-base-t-h,w,h,5,fill=1,stroke=1)
        st=ParagraphStyle('box',fontName='LiberationSerif-Bold' if bold else 'LiberationSerif',fontSize=10.5,leading=13,alignment=TA_CENTER)
        p=Paragraph(txt,st);_,ph=p.wrap(w-12,h);p.drawOn(c,LEFT+x+6,H-base-t-(h+ph)/2)
    def arrow(x1,t1,x2,t2):
        a,b=LEFT+x1,H-base-t1;d,e=LEFT+x2,H-base-t2
        c.setStrokeColor(colors.HexColor('#334155'));c.setFillColor(colors.HexColor('#334155'));c.setLineWidth(.8);c.line(a,b,d,e)
        angle=math.atan2(e-b,d-a);p=c.beginPath();p.moveTo(d,e)
        p.lineTo(d-5*math.cos(angle-.45),e-5*math.sin(angle-.45));p.lineTo(d-5*math.cos(angle+.45),e-5*math.sin(angle+.45));p.close();c.drawPath(p,fill=1,stroke=0)
    if kind=='architecture':
        box(141,0,226,40,'USER<br/>Laboratory values in mg/dL',bold=True)
        arrow(254,40,254,60)
        box(41,60,426,54,'REACT INTERFACE<br/>Home | Analyzer | Dashboard | Learn | PCSK9',bold=True)
        arrow(254,114,254,139)
        box(70,139,368,42,'HTTP JSON REQUEST<br/>POST /api/analyze')
        arrow(254,181,254,206)
        box(41,206,426,57,'PYTHON FASTAPI BACKEND<br/>Pydantic validation → reference rules → Decimal calculations',bold=True)
        arrow(254,263,254,288)
        box(41,288,426,55,'STRUCTURED JSON RESPONSE<br/>Categories | explanations | scales | non-HDL | ratio | sources')
        arrow(254,343,254,366)
        box(41,366,426,43,'REACT DASHBOARD<br/>Chart.js graphs and readable result cards')
        height=420
    elif kind=='flow':
        box(0,0,142,42,'Enter LDL, HDL,<br/>total and HDL context')
        box(183,0,142,42,'Server validates<br/>numeric readings')
        box(366,0,142,42,'Invalid input<br/>HTTP 422 and field error',fill='#fff7ed')
        arrow(142,21,183,21);arrow(325,21,366,21)
        arrow(254,42,254,66)
        box(145,66,218,42,'Valid input<br/>Apply ordered reference rules')
        arrow(254,108,254,132)
        box(87,132,334,42,'Calculate non-HDL and total/HDL ratio<br/>Return structured result to the dashboard')
        height=185
    elif kind=='pcsk9':
        box(131,0,246,42,'PCSK9 GENE<br/>DNA instructions for the PCSK9 protein',bold=True)
        arrow(254,42,254,66)
        box(131,66,246,42,'PCSK9 PROTEIN<br/>Influences LDL receptor availability')
        box(0,139,237,42,'RECEPTOR RECYCLING PATHWAY',bold=True)
        box(271,139,237,42,'PCSK9-ASSOCIATED PATHWAY',bold=True)
        arrow(254,108,390,139)
        box(0,204,237,54,'LDL uptake and release<br/>Receptor returns to liver cell surface',fill='#eef6f2')
        box(271,204,237,54,'PCSK9 binds LDL receptor<br/>Internalized receptor is directed to degradation',fill='#fff5ee')
        arrow(119,181,119,204);arrow(390,181,390,204)
        box(0,280,237,42,'Receptor can capture LDL again',fill='#eef6f2')
        box(271,280,237,42,'Fewer receptors available for LDL uptake',fill='#fff5ee')
        arrow(119,258,119,280);arrow(390,258,390,280)
        height=333
    else:
        steps=[('Analyzer in App.tsx','Read inputs and run basic form checks'),('api.ts','JSON POST, timeout and response validation'),('backend/models.py','Strict field and consistency validation'),('backend/analysis.py','Classify values and calculate derived measures'),('Dashboard in App.tsx','Render the server result and explanatory charts')]
        for i,(a,b) in enumerate(steps):
            top=i*63
            box(64,top,380,44,f'<b>{a}</b><br/>{b}')
            if i<4:arrow(254,top+44,254,top+63)
        height=307
    c.setFillColor(colors.black);c.setStrokeColor(colors.black);y+=height

# 1 Cover follows the supplied reference positions and sizes.
start()
center('DEPARTMENT OF INFORMATION TECHNOLOGY',12,True,113.4)
c.drawImage(str(TMP/'Im9.png'),277.95,597.85,width=56.15,height=59.05,mask='auto')
center('Synopsis Report on Mini Project',15,True,206.1)
center('Minor in Fundamentals of Human Physiology',12,False,233.1)
center('and Biomedical Engineering',12,False,248.7)
center('CholesterolWise',22,True,275.8)
center('LDL Cholesterol Analyzer',13,False,307.7)
center('Interactive Analysis and PCSK9 Awareness',13,False,324.6)
center('Prepared By',12,True,365.2)
center('Kush Pagariya   |   TY B   |   Roll No 25',12,False,388.8)
center('Moksh Patel   |   TY B   |   Roll No 29',12,False,412.2)
center('Reedham Parmar   |   TY B   |   Roll No 28',12,False,435.6)
center('Under the guidance of',12,False,469)
center('Dr. Reena Lokare',13,True,493)
center('Subject Teacher',11,False,519)
center('Department of Information Technology',11.5,True,571)
center('Third Year Engineering   |   Division B',11.5,True,586)
center('Academic Year 2026-2027',11.5,True,601)
y=617

# 2 Certificate. Signature lines intentionally remain unsigned.
start('Certificate',bookmark='certificate')
block('This is to certify that the following students of Third Year Engineering, Division B, Department of Information Technology, have prepared the mini project synopsis titled <b>CholesterolWise - LDL Cholesterol Analyzer</b> for the Minor in Fundamentals of Human Physiology and Biomedical Engineering during the academic year 2026-2027 under the guidance of <b>Dr. Reena Lokare</b>.')
table(['Name of Student','Class and Division','Roll No'],[['Kush Pagariya','TY B','25'],['Moksh Patel','TY B','29'],['Reedham Parmar','TY B','28']],[234,166,108])
block('This synopsis presents the problem, objectives, literature survey, system design, implementation methodology, software testing results and future scope of the mini project.')
y+=30
base=y
block('<b>Dr. Reena Lokare</b><br/>Subject Teacher<br/>Department of Information Technology','left',x=52,width=245)
y=base
block('<b>Dr. Radhika Kotecha</b><br/>Head of Department<br/>Department of Information Technology','left',x=315,width=245)
y+=30
block('Date of Examination  ____________________','left',gap=28)
block('Signature of Internal Examiner','left',x=52,width=250)
y-=24.95
block('Signature of External Examiner','left',x=340,width=220)

# 3 Table of contents.
start('Table of Contents',bookmark='contents')
table(['Contents','Page'],[['Certificate','2'],['Acknowledgement','4'],['Chapter 1  Problem Statement and Project Objectives','5'],['Chapter 2  Literature Survey and Proposed Solution','6'],['Chapter 3  System Design and Methodology','8'],['Chapter 4  Implementation, Experimentation and Results','12'],['Chapter 5  Conclusion and Future Enhancements','17'],['References','18']],[458,50])

# 4 Acknowledgement.
start('Acknowledgement',bookmark='acknowledgement')
block('We express our sincere gratitude to our subject teacher and project guide, <b>Dr. Reena Lokare</b>, for the academic guidance associated with this mini project. The project connects concepts from human physiology and biomedical engineering with a practical information technology application for understanding cholesterol reports.')
block('We acknowledge the Department of Information Technology at <b>K J Somaiya Institute of Technology</b> for providing the academic setting for this work. The minor course encouraged us to connect a biological mechanism with the design and implementation of an interactive educational website.')
block('We acknowledge the researchers whose published studies on PCSK9, LDL receptors and cholesterol regulation informed the educational content. We also acknowledge the National Library of Medicine and the National Heart, Lung, and Blood Institute for their public health information and reference material.')
block('The official documentation for React, FastAPI, React Three Fiber and Chart.js supported the technical implementation. These resources helped us organize the interface, backend validation, graphical presentation and interactive three-dimensional illustrations.')
block('We are grateful to our classmates and families for their encouragement. Our work emphasizes a clear project scope, understandable explanations and a distinction between verified software behavior and health outcomes that have not been evaluated.')
y+=15
block('Kush Pagariya | TY B 25<br/>Moksh Patel | TY B 29<br/>Reedham Parmar | TY B 28','left')

# 5 Chapter 1.
start('Problem Statement and Project Objectives',chapter=1,bookmark='chapter1')
heading('1.1 Project overview')
block('CholesterolWise is a web-based educational application that explains manually entered LDL, HDL and total cholesterol readings. A React interface presents server-generated categories, charts and derived calculations. Interactive three-dimensional heart, DNA and PCSK9 illustrations connect the numerical report with the underlying physiology.')
heading('1.2 Problem statement')
block('A laboratory report contains measurements and reference information, but a reader may still find it difficult to connect the numbers with cholesterol transport and clearance. The engineering problem is to provide a simple, consistent interface that explains these measurements, shows their reference categories and introduces the role of PCSK9 without implying that three measurements are sufficient for a medical diagnosis [1], [2].')
heading('1.3 Project objectives')
bullets(['Accept LDL, HDL and total cholesterol in mg/dL with optional adult HDL reference context.','Validate readings and classify them using explicit backend reference rules.','Calculate non-HDL cholesterol and the total/HDL ratio using decimal arithmetic.','Present categories, scales, charts and plain-language explanations on a dashboard.','Explain LDL, HDL, cholesterol regulation and general lifestyle awareness.','Demonstrate receptor recycling and PCSK9-associated degradation through interactive 3D scenes.','Verify input handling, boundary rules, API reliability and interface behavior.'])
heading('1.4 Scope and intended outcome')
block('The implemented prototype covers five screens: Home, Analyzer, Dashboard, Learn and PCSK9. Its general reference categories apply to adults aged 20 and above. It does not provide personalized treatment targets, disease prediction, genetic testing or machine learning. Clinical interpretation requires wider health context [1], [2].')

# 6 Chapter 2.
start('Literature Survey and Proposed Solution',chapter=2,bookmark='chapter2')
heading('2.1 Review of related work')
block('<b>Reference categories and lipid interpretation.</b> The NCEP Adult Treatment Panel III executive summary [3] documents the familiar LDL and total cholesterol category boundaries used by the prototype. These historical categories support transparent educational classification; they are not presented as a complete contemporary treatment algorithm. MedlinePlus [1], [2] provides accessible explanations and emphasizes the need for individual clinical context.')
block('<b>Discovery of the PCSK9 association.</b> Abifadel et al. [4] identified PCSK9 mutations associated with autosomal dominant hypercholesterolemia. The study established a link between this gene and inherited elevated cholesterol. CholesterolWise uses this finding to explain why a gene can influence lipid regulation; the website does not infer a user\'s genotype from cholesterol values.')
block('<b>Human genetic evidence.</b> Cohen et al. [5] examined LDL-lowering PCSK9 sequence variants and coronary events over a 15-year interval in the ARIC study. Lower LDL associated with these variants accompanied lower coronary disease incidence. This supports the biological relevance of the educational module, while providing no validation of this website as a risk calculator.')
block('<b>Receptor mechanism.</b> Zhang et al. [6] studied PCSK9 binding to the LDL receptor and showed interference with receptor recycling, with increased receptor degradation. This mechanism informs the application\'s comparison between receptor recycling and the PCSK9-associated pathway. The scene is a schematic explanation rather than an atomic structure or quantitative simulation.')
block('<b>Clinical relevance of PCSK9.</b> Sabatine et al. [7] reported the FOURIER randomized trial in 27,564 patients with established cardiovascular disease receiving statins. Evolocumab reduced LDL and cardiovascular events relative to placebo. The study explains the clinical importance of PCSK9 biology; its treatment findings do not establish any benefit from using an educational website.')
heading('2.2 Identified design opportunity')
block('The project combines a transparent interpretation workflow with visual physiology education in one student-scale application. This is an integration objective, not a claim that existing products lack these features. Understanding and usability must be evaluated separately from the software\'s numerical correctness.')

# 7 Evidence table and proposed solution.
start()
heading('2.3 Evidence comparison')
table(['Source','Contribution to CholesterolWise','Limit of application'],[
 ['NCEP and MedlinePlus [1]-[3]','Explicit LDL, HDL and total reference explanations.','Categories are general; personal treatment targets vary.'],
 ['Abifadel et al. [4]','Gene-to-protein introduction for PCSK9.','No genotype inference or genetic diagnosis.'],
 ['Cohen et al. [5]','Connects inherited LDL regulation with human outcomes.','Genetic association is not a website prediction model.'],
 ['Zhang et al. [6]','Recycling versus degradation animation.','Schematic geometry; no molecular dynamics.'],
 ['Sabatine et al. [7]','Explains why PCSK9 is clinically relevant.','No medicine selection, dosing or treatment advice.']],[117,197,194])
heading('2.4 Proposed solution and implemented scope')
block('A user enters readings from a laboratory report and selects an optional HDL context. React sends a JSON request to FastAPI. The backend validates the input, applies deterministic reference rules and returns the complete interpretation. The dashboard renders the response using result cards, a bar chart and calculated values.')
block('The Learn section introduces cholesterol terminology and general lifestyle awareness. The PCSK9 section provides an animated DNA illustration and a stepwise comparison of LDL receptor pathways. Play, pause, stage selection and view-reset controls allow the learner to inspect the process at a comfortable pace.')
heading('2.5 Why a rule-based approach is suitable')
block('The task is to explain established categories, so a readable ordered rule table is appropriate. It requires no training dataset, fitted parameters or prediction score. Rules can be inspected and tested directly at every cutoff. The same validated input produces the same interpretation and calculations.')
heading('2.6 Physiology and educational boundary')
block('PCSK9 is a gene that encodes a protein involved in regulating LDL receptor availability. The website distinguishes the DNA illustration from the protein and receptor mechanism [6], [8]. Neither the animation nor the measured lipid values establish the presence of a PCSK9 mutation.')

# 8 Architecture.
start('System Design and Methodology',chapter=3,bookmark='chapter3')
heading('3.1 System architecture')
block('The implementation separates the browser interface from the Python analysis service. The browser owns interaction and visual presentation; the server owns all reference classifications and derived calculations. No database is required for the current analysis session.')
diagram('architecture')
caption('Figure 3.1 Implemented frontend and backend architecture')
block('In the local production configuration, FastAPI serves the built React files and API from the same origin. Educational pages are frontend content; an analysis request requires the Python service to be available.','small')

# 9 Methodology and cutoffs.
start()
heading('3.2 Input and analysis workflow')
diagram('flow')
caption('Figure 3.2 Valid input and validation-error paths')
heading('3.3 LDL and total cholesterol reference rules')
table(['Parameter','Category','Implemented interval in mg/dL'],[
 ['LDL','Optimal','0 < value < 100'],['LDL','Near optimal','100 <= value < 130'],['LDL','Borderline high','130 <= value < 160'],['LDL','High','160 <= value < 190'],['LDL','Very high','value >= 190'],
 ['Total','Desirable','0 < value < 200'],['Total','Borderline high','200 <= value < 240'],['Total','High','value >= 240']],[100,160,248])
block('Rules are checked in ascending order and the first matching interval is selected. Upper bounds are exclusive, so a decimal reading such as LDL 129.9 remains near optimal and 130 becomes borderline high. The conventional categories originate from general adult reference material [2], [3].','small')
heading('3.4 HDL context')
block('HDL below 40 is low for the male context and below 50 is low for the female context. With context unspecified, 40 to below 50 is labelled context-dependent. Values above the applicable low threshold and below 60 are intermediate; values at least 60 are labelled generally favorable. A favorable HDL label does not cancel other risk factors [1], [2].','small')

# 10 Formulas and contract.
start()
heading('3.5 Exact backend calculation method')
block('The analysis engine performs deterministic classification and two derived calculations. LDL is entered from the laboratory report; it is not estimated. Triglycerides are not collected, so the Friedewald equation is not used.')
table(['Derived measure','Formula and implementation'],[
 ['Non-HDL cholesterol','Total cholesterol - HDL cholesterol (mg/dL) [9]. Subtraction uses Python Decimal.'],
 ['Total/HDL ratio','Total cholesterol / HDL cholesterol. Decimal division is rounded to two places using ROUND_HALF_UP. The ratio has no unit.']],[157,351])
block('<b>Worked example:</b> total = 210.1 mg/dL and HDL = 45.2 mg/dL. Non-HDL = 210.1 - 45.2 = <b>164.9 mg/dL</b>. Total/HDL = 210.1 / 45.2 = 4.6482..., displayed as <b>4.65</b>. Decimal values are created from the validated readings\' string representations to avoid common binary subtraction artifacts.')
heading('3.6 Server validation')
block('Pydantic accepts finite positive JSON numbers and rejects strings, booleans, missing required fields and unexpected fields. Input caps are LDL 1000, HDL 300 and total 1500 mg/dL. These are typing and unit guardrails, not clinical thresholds. Total must not be lower than either entered LDL or entered HDL. The backend does not enforce a total-versus-component-sum rule.')
heading('3.7 API contract')
table(['Method and path','Purpose'],[['POST /api/analyze','Validate readings; return categories, explanations, scales and calculations.'],['GET /api/reference-ranges','Expose reference categories, formulas, guardrails, sources and engine version.'],['GET /api/health','Return service health and analysis engine version.']],[180,328])
block('The analysis response includes readings, units, metric results, non-HDL, ratio, a discussion prompt, source URLs and engine version 1.0.0. Invalid requests return HTTP 422 with field-level messages. React displays these messages beside the relevant input.','small')

# 11 Physiology and privacy.
start()
heading('3.8 PCSK9 visualization methodology')
block('The educational scene contrasts the reuse of an LDL receptor with PCSK9-associated receptor degradation [6], [8]. The schematic uses Three.js geometry through React Three Fiber. It is intended to communicate a sequence of events, not protein shape, binding affinity or a patient-specific rate.')
diagram('pcsk9')
caption('Figure 3.3 Schematic PCSK9 and LDL receptor pathways [6], [8]')
heading('3.9 Interaction and accessibility')
block('Users can rotate the scenes, pause animation, choose explanation stages and reset the view. The interface supports reduced-motion preferences and a two-dimensional fallback when WebGL is unavailable. Responsive layouts, visible labels and keyboard-accessible controls support use across screen sizes.')
heading('3.10 Data handling')
block('Readings are processed in server memory and retained only in the active React session. The app implements no accounts, patient database or request-body logging, and API responses use Cache-Control: no-store. Reloading clears the current results. A future remote deployment must also configure its hosting and proxy logs appropriately.','small')

# 12 Stack.
start('Implementation, Experimentation and Results',chapter=4,bookmark='chapter4')
heading('4.1 Implemented technology stack')
table(['Layer','Technology','Purpose'],[
 ['Frontend','React 19, TypeScript, Vite','Component-based pages and production build [10].'],
 ['Styling and navigation','Custom CSS; React Router','Navy landing theme, light dashboard and responsive navigation.'],
 ['Interactive 3D','Three.js; React Three Fiber; Drei','Heart, DNA and receptor illustrations with camera controls [12].'],
 ['Charts','Chart.js; react-chartjs-2','Lipid values and result visualization [13].'],
 ['Backend','Python; FastAPI; Pydantic; Uvicorn','Typed API, strict validation and server execution [11].'],
 ['Calculation','Python Decimal; ordered rules','Reference-range comparison and precise derived arithmetic.'],
 ['Verification','pytest; HTTPX; Vitest','Backend tests and frontend form/API tests.']],[79,189,240])
heading('4.2 Main application modules')
block('<b>Home:</b> project introduction, animated heart and navigation to analysis.<br/><b>Analyzer:</b> numeric lipid inputs, optional HDL context and field errors.<br/><b>Dashboard:</b> categories, reference scales, chart, explanations and derived values.<br/><b>Learn:</b> cholesterol concepts and general health-awareness information.<br/><b>PCSK9:</b> DNA illustration and interactive receptor-pathway comparison.','left')
heading('4.3 Implementation sequence')
block('Development proceeded through the interface and core routes, interactive 3D scenes, rule-based interpretation, Python API integration and verification. Clinical rules were centralized in the backend, while React retained presentation and basic input checks. The API-dependent version has been verified locally; public full-stack deployment requires a Python-capable host.')

# 13 Workflow.
start()
heading('4.4 Implementation workflow')
block('A single request pipeline connects the form to the result screen. The frontend does not silently recompute clinical results if the server is unavailable. A failed request produces a visible message while preserving the entered values.')
diagram('implementation')
caption('Figure 4.1 Implemented request and rendering pipeline')
heading('4.5 Experimental setup and procedure')
block('Verification used the local Windows development environment, the production React build, FastAPI TestClient and browser checks. Test inputs are synthetic lipid values rather than patient records. Tests compare actual returned labels and arithmetic with explicit expected outputs, including values immediately below and at category boundaries.')
block('The API client has a 15-second timeout, supports cancellation and rejects invalid or incomplete responses. Browser checks covered sample analysis, field-error display, decimal results, mobile navigation and 3D controls. No volunteer usability study or clinical evaluation was conducted.','small')

# 14 Results.
start()
heading('4.6 Test inputs and observed calculations')
block('The cases below exercise the implemented rules. All values are illustrative software-test inputs in mg/dL. HDL context is unspecified unless shown otherwise. The ratio column uses backend half-up rounding to two decimal places.','small')
table(['Case','LDL / HDL / Total','LDL; HDL; total categories','Non-HDL','Ratio'],[
 ['1','80 / 65 / 170','Optimal; generally favorable; desirable','105','2.62'],
 ['2','120 / 45 / 210','Near optimal; context-dependent; borderline high','165','4.67'],
 ['3','150 / 35 / 230','Borderline high; low; borderline high','195','6.57'],
 ['4','195 / 38 / 260','Very high; low; high','222','6.84'],
 ['5\nFemale','120 / 45.2 / 210.1','Near optimal; low; borderline high','164.9','4.65']],[40,115,218,78,57],fontsize=10)
heading('4.7 Recorded software verification')
table(['Check','Recorded result','Coverage'],[
 ['Backend automated suite','46 passed','Category boundaries, HDL context, validation, decimal results, API behavior and request isolation.'],
 ['Frontend automated suite','16 passed','Nine input-validation tests and seven API-client tests.'],
 ['Production build','Passed','TypeScript checking and Vite production bundling.'],
 ['Browser checks','Completed','Sample flow, server errors, decimal display, responsive navigation and 3D interaction.']],[132,94,282])
heading('4.8 Interpretation of results')
block('The recorded 62 passing automated tests support agreement with the implemented rules for the tested cases. They do not establish diagnostic accuracy, comprehensive test coverage or an improvement in health awareness. The large 3D bundle remains a performance consideration; low-powered devices and slow connections need broader evaluation.')
block('The results demonstrate a functioning input-to-dashboard workflow and reproducible calculations. Usability, learning outcomes, clinical content review and public hosting remain separate evaluation or deployment tasks.','small')

# 15 Actual landing screenshot.
start()
heading('4.9 Project screenshots')
block('The following figures show the implemented website. They document the actual interface and use illustrative readings. They are not conceptual mockups or patient reports.','small')
heading('4.9.1 Landing page')
screenshot('landing-preview.jpg')
caption('Figure 4.2 CholesterolWise landing page with interactive schematic heart')
block('The landing page uses a dark navy background, blue accents and a prominent route to the analyzer. The heart scene introduces the subject visually and supports drag-to-rotate, pause and reset interactions.')
heading('4.9.2 Educational integration')
block('Navigation connects the landing page with the analyzer, dashboard, cholesterol learning content and PCSK9 module. The 3D objects are labelled as schematic illustrations. Their role is explanatory; they do not visualize a user\'s heart or genetic data.')

# 16 Actual backend dashboard screenshot.
start()
heading('4.9.3 Backend-connected dashboard')
screenshot('backend-preview.jpg',width=508,maxheight=420)
caption('Figure 4.3 Dashboard for LDL 120, HDL 45.2 and total 210.1 mg/dL, female context')
block('The dashboard shows near-optimal LDL, low HDL for the selected female context and borderline-high total cholesterol. Its non-HDL result of 164.9 mg/dL and total/HDL ratio of 4.65 come from the Python backend. The chart compares quantities; bar length is not a health score.','small')
heading('4.10 Demonstration and deployment status')
block('The project can be demonstrated locally using the supplied PowerShell launcher, which builds React and starts FastAPI. The current private static preview cannot execute the Python backend. The complete application needs a Python or container host before the integrated analysis can be offered remotely.','small')

# 17 Conclusion.
start('Conclusion and Future Enhancements',chapter=5,bookmark='chapter5')
heading('5.1 Conclusion')
block('CholesterolWise demonstrates how a web application can combine transparent numerical interpretation with visual biomedical education. The implemented React interface accepts lipid readings and renders the results returned by a Python FastAPI service. Reference classifications, non-HDL cholesterol and the total/HDL ratio are calculated in one backend module.')
block('Interactive heart, DNA and PCSK9 scenes connect the user interface with cholesterol physiology. The literature supports the biological explanation, while the software checks establish the tested behavior of the application. The project therefore provides a working educational prototype without claiming disease prediction, treatment effectiveness or measured improvement in user knowledge.')
heading('5.2 Future enhancements')
bullets(['Add authenticated profiles and optional history, with consent, deletion controls and secure storage.','Support longitudinal charts and downloadable summaries of user-selected readings.','Introduce report upload with user confirmation of extracted values before analysis.','Add carefully validated unit conversion and clearer support for laboratory-specific reference information.','Expand Hindi and Marathi content, keyboard testing and accessibility evaluation.','Improve 3D loading performance and evaluate the interface on a wider range of mobile devices.','Arrange professional review of educational content and conduct a small usability study.','Extend PCSK9 education with reviewed explanations of genetic variation, keeping it separate from individual genetic assessment.'])
heading('5.3 Limitations and learning outcomes')
block('The prototype uses general adult references and collects only a limited set of lipid readings. It does not incorporate full medical history, blood pressure, medications or other clinical factors. Persistent records, report extraction and public backend hosting are not completed features. The work supports learning in React development, typed APIs, validation, decimal arithmetic, testing, 3D interaction and responsible use of biomedical evidence.')

# 18 References with verified sources and clickable links.
start('References',bookmark='references')
refs=[
('[1] National Library of Medicine, "Cholesterol Levels," MedlinePlus Medical Test.','https://medlineplus.gov/lab-tests/cholesterol-levels/'),
('[2] National Library of Medicine, "High blood cholesterol levels," MedlinePlus Medical Encyclopedia.','https://medlineplus.gov/ency/article/000403.htm'),
('[3] National Cholesterol Education Program, Third Report of the Expert Panel on Detection, Evaluation, and Treatment of High Blood Cholesterol in Adults (Adult Treatment Panel III), Executive Summary. NIH Publication No. 01-3670, 2001.','https://www.nhlbi.nih.gov/files/docs/guidelines/atp3xsum.pdf'),
('[4] M. Abifadel et al., "Mutations in PCSK9 cause autosomal dominant hypercholesterolemia," Nature Genetics, vol. 34, no. 2, pp. 154-156, 2003. doi: 10.1038/ng1161.','https://doi.org/10.1038/ng1161'),
('[5] J. C. Cohen, E. Boerwinkle, T. H. Mosley Jr., and H. H. Hobbs, "Sequence variations in PCSK9, low LDL, and protection against coronary heart disease," New England Journal of Medicine, vol. 354, pp. 1264-1272, 2006. doi: 10.1056/NEJMoa054013.','https://doi.org/10.1056/NEJMoa054013'),
('[6] D.-W. Zhang et al., "Binding of proprotein convertase subtilisin/kexin type 9 to epidermal growth factor-like repeat A of low density lipoprotein receptor decreases receptor recycling and increases degradation," Journal of Biological Chemistry, vol. 282, no. 25, pp. 18602-18612, 2007. doi: 10.1074/jbc.M702027200.','https://doi.org/10.1074/jbc.M702027200'),
('[7] M. S. Sabatine et al., "Evolocumab and clinical outcomes in patients with cardiovascular disease," New England Journal of Medicine, vol. 376, pp. 1713-1722, 2017. doi: 10.1056/NEJMoa1615664.','https://doi.org/10.1056/NEJMoa1615664'),
('[8] National Library of Medicine, "PCSK9 gene," MedlinePlus Genetics.','https://medlineplus.gov/genetics/gene/pcsk9/'),
('[9] National Heart, Lung, and Blood Institute, "Blood Cholesterol: Diagnosis."','https://www.nhlbi.nih.gov/health/blood-cholesterol/diagnosis'),
('[10] React, "Quick Start," React documentation.','https://react.dev/learn'),
('[11] FastAPI, "FastAPI," official documentation.','https://fastapi.tiangolo.com/'),
('[12] React Three Fiber, "Introduction," official documentation.','https://r3f.docs.pmnd.rs/getting-started/introduction'),
('[13] Chart.js, official documentation.','https://www.chartjs.org/docs/latest/'),
]
for text,url in refs:
    # DOI citations link the article title paragraph without repeating a long URL.
    if 'doi:' in text:
        body=f'<link href="{url}" color="black">{escape(text)}</link>'
    else:
        body=escape(text)+f' <link href="{url}" color="black">{escape(url)}</link>'
    block(body,'ref',gap=8)
block('Online resources verified on November 2, 2026. Project source: supplied CholesterolWise brief and the implemented React/FastAPI codebase, analysis engine 1.0.0. Institutional layout follows the supplied synopsis reference.','ref',gap=0)
audit.append({'page':page,'content_bottom':round(y,2)})
c.save()
(TMP/'layout_audit.json').write_text(json.dumps(audit,indent=2))
assert page==18
print(f'Created {OUT} ({page} pages)')
print(json.dumps(audit))
