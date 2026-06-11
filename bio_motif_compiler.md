# Bio Motif Compiler MVP

## Status

This is a structural biology Motif compiler MVP. It stitches together open data adapters and emits BioMotifIR. It does not perform molecular dynamics, docking, clinical prediction, or drug validation.

## Input

- UniProt accession: `P00533`
- Protein: Epidermal growth factor receptor
- Gene: EGFR
- IR artifact: `artifacts/bio_motif/P00533_bio_motif_ir.json`

## Data Sources

- UniProt REST API
- AlphaFold DB direct model file
- Reactome ContentService mapping endpoint
- fpocket not installed; deterministic geometry fallback used

## Pathway Context

| Reactome ID | Pathway |
| --- | --- |
| R-HSA-1227986 | Signaling by ERBB2 |
| R-HSA-1236382 | Constitutive Signaling by Ligand-Responsive EGFR Cancer Variants |
| R-HSA-1236394 | Signaling by ERBB4 |
| R-HSA-1250196 | SHC1 events in ERBB2 signaling |
| R-HSA-1251932 | PLCG1 events in ERBB2 signaling |
| R-HSA-1257604 | PIP3 activates AKT signaling |
| R-HSA-177929 | Signaling by EGFR |
| R-HSA-179812 | GRB2 events in EGFR signaling |
| R-HSA-180292 | GAB1 signalosome |
| R-HSA-180336 | SHC1 events in EGFR signaling |

## Macro Pathway AST

| Node | Role | Motifs |
| --- | --- | --- |
| Signaling by ERBB2 | authority_process | Composition, Hierarchy, Communication, Feedback, Transition, Authority, Boundary |
| Constitutive Signaling by Ligand-Responsive EGFR Cancer Variants | disease_variant | Composition, Hierarchy, Communication, Feedback, Transition, Authority, Boundary, Invariant, Decay |
| Signaling by ERBB4 | authority_process | Composition, Hierarchy, Communication, Feedback, Transition, Authority, Boundary |
| SHC1 events in ERBB2 signaling | authority_process | Composition, Hierarchy, Communication, Feedback, Transition, Authority, Boundary, Modularity, Reconciliation |
| PLCG1 events in ERBB2 signaling | authority_process | Composition, Hierarchy, Communication, Feedback, Transition, Authority, Boundary, Modularity, Reconciliation |
| PIP3 activates AKT signaling | feedback_module | Composition, Hierarchy, Communication, Feedback, Transition, Terminal State |
| Signaling by EGFR | authority_process | Composition, Hierarchy, Communication, Feedback, Transition, Authority, Boundary |
| GRB2 events in EGFR signaling | authority_process | Composition, Hierarchy, Communication, Feedback, Transition, Authority, Boundary, Modularity, Reconciliation |
| GAB1 signalosome | signal_flow | Composition, Hierarchy, Communication, Feedback, Transition, Modularity, Reconciliation |
| SHC1 events in EGFR signaling | authority_process | Composition, Hierarchy, Communication, Feedback, Transition, Authority, Boundary, Modularity, Reconciliation |
| EGFR downregulation | authority_process | Composition, Hierarchy, Authority, Boundary |
| GRB2 events in ERBB2 signaling | authority_process | Composition, Hierarchy, Communication, Feedback, Transition, Authority, Boundary, Modularity, Reconciliation |

## Structure Summary

- Residues parsed from AlphaFold PDB: 1210
- Mean pLDDT: 75.95
- Low-confidence residues (pLDDT < 70): 355
- PDB cache: `artifacts/bio_motif/AF-P00533-F1-model_v6.pdb`

## Motif-Annotated Protein Features

| Feature | Residues | Motifs | Description |
| --- | ---: | --- | --- |
| Topological domain | 25-645 | Boundary, Communication, Modularity, Hierarchy | Extracellular |
| Transmembrane | 646-668 | Boundary, Communication | Helical |
| Topological domain | 669-1210 | Boundary, Communication, Modularity, Hierarchy | Cytoplasmic |
| Repeat | 75-300 | Modularity, Hierarchy | Approximate |
| Repeat | 390-600 | Modularity, Hierarchy | Approximate |
| Domain | 712-979 | Transition, Authority, Modularity, Hierarchy | Protein kinase |
| Region | 688-704 | Communication, Feedback, Authority, Modularity, Hierarchy | Important for dimerization, phosphorylation and activation |
| Region | 1097-1137 | Decay, Representation, Modularity, Hierarchy | Disordered |
| Compositional bias | 1104-1115 | Decay, Representation | Polar residues |
| Compositional bias | 1128-1137 | Decay, Representation | Polar residues |
| Active site | 837-837 | Transition, Authority | Proton acceptor |
| Binding site | 718-726 | Boundary, Transition | - |
| Binding site | 745-745 | Boundary, Transition | - |
| Binding site | 790-791 | Boundary, Transition | - |
| Binding site | 855-855 | Boundary, Transition | - |
| Site | 1016-1016 | Communication, Feedback, Authority | Important for interaction with PIK3C2B |
| Modified residue | 229-229 | Feedback, Communication | Phosphoserine |
| Modified residue | 678-678 | Feedback, Communication | Phosphothreonine; by PKC and PKD/PRKD1 |
| Modified residue | 693-693 | Feedback, Communication | Phosphothreonine; by PKD/PRKD1 |
| Modified residue | 695-695 | Feedback, Communication | Phosphoserine |
| Modified residue | 745-745 | Feedback, Communication | N6-(2-hydroxyisobutyryl)lysine |
| Modified residue | 869-869 | Feedback, Communication | Phosphotyrosine |
| Modified residue | 991-991 | Feedback, Communication | Phosphoserine |
| Modified residue | 995-995 | Feedback, Communication | Phosphoserine |

## Ranked Allosteric-Style Targets

| Rank | Candidate | Residues | Score | Conf. | Motifs | Source | Rationale |
| ---: | --- | ---: | ---: | ---: | --- | --- | --- |
| 1 | Mutagenesis: Decreases intramolecular interactions and facilitates EGF binding. Increased EGF binding; when associated with A-587; A-590 and A-609. | 609-609 | 4.343 | 0.943 | Communication, Feedback, Authority | uniprot_feature_proxy | UniProt feature projected onto AlphaFold residue coordinates. Motif score favors Communication/Feedback/Authority and penalizes direct active-site Transition proximity. |
| 2 | Mutagenesis: Decreases intramolecular interactions and facilitates EGF binding. | 587-590 | 4.337 | 0.937 | Communication, Feedback, Authority | uniprot_feature_proxy | UniProt feature projected onto AlphaFold residue coordinates. Motif score favors Communication/Feedback/Authority and penalizes direct active-site Transition proximity. |
| 3 | Region: Important for dimerization, phosphorylation and activation | 688-704 | 4.105 | 0.405 | Communication, Feedback, Authority, Modularity, Hierarchy | uniprot_feature_proxy | UniProt feature projected onto AlphaFold residue coordinates. Motif score favors Communication/Feedback/Authority and penalizes direct active-site Transition proximity. |
| 4 | Site: Important for interaction with PIK3C2B | 1016-1016 | 3.992 | 0.592 | Communication, Feedback, Authority | uniprot_feature_proxy | UniProt feature projected onto AlphaFold residue coordinates. Motif score favors Communication/Feedback/Authority and penalizes direct active-site Transition proximity. |
| 5 | Mutagenesis: 50% decrease in interaction with PIK3C2B. 65% decrease in interaction with PIK3C2B; when associated with F-1197. Abolishes interaction with PIK3C2B; when associated with F-1197 and F-1092. | 1016-1016 | 3.992 | 0.592 | Communication, Feedback, Authority | uniprot_feature_proxy | UniProt feature projected onto AlphaFold residue coordinates. Motif score favors Communication/Feedback/Authority and penalizes direct active-site Transition proximity. |
| 6 | Lower-confidence flexible window 1009-1026 | 1009-1026 | 3.867 | 0.467 | Communication, Feedback, Authority | confidence_geometry_proxy | AlphaFold pLDDT suggests a flexible or uncertain region that may participate in regulation or disorder. Motif score favors Communication/Feedback/Authority and penalizes direct active-site Transition proximity. |
| 7 | Mutagenesis: No change in interaction with PIK3C2B. | 1172-1172 | 3.768 | 0.367 | Communication, Feedback, Authority | uniprot_feature_proxy | UniProt feature projected onto AlphaFold residue coordinates. Motif score favors Communication/Feedback/Authority and penalizes direct active-site Transition proximity. |
| 8 | Mutagenesis: Strongly decreases interaction with CBLC. | 1068-1068 | 3.759 | 0.359 | Communication, Feedback, Authority | uniprot_feature_proxy | UniProt feature projected onto AlphaFold residue coordinates. Motif score favors Communication/Feedback/Authority and penalizes direct active-site Transition proximity. |

## Caveats

- This MVP ranks structural intervention candidates; it does not predict clinical efficacy, toxicity, binding energy, or druggability.
- AlphaFold structures are predictions. Low pLDDT or disordered regions should be treated carefully.
- Fpocket was not available in this local run unless explicitly listed in dataSources; fallback pockets are geometry/annotation proxies.
- Use experimental structures, ligand co-crystals, molecular docking, and wet-lab validation before making scientific claims.

## What This Proves

- The open-source adapters are enough to build a macro/micro biological AST prototype.
- UniProt feature annotations can be projected onto AlphaFold coordinates as typed motif roles.
- Local pocket tools such as fpocket can be plugged in when installed; the MVP still runs with deterministic geometry proxies.
- The proprietary layer is the motif scoring and compilation logic, not the raw biological databases.
