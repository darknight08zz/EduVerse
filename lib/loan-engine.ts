// lib/loan-engine.ts

import { supabase } from './supabase';
import { generateWithGemini } from './gemini';

export interface LoanProduct {
  lender: string;
  productName: string;
  maxAmount: string;
  interestRate: string;
  collateralRequired: boolean;
  coSignerRequired: boolean;
  processingFee: string;
  moratorium: string;
  repaymentPeriod: string;
  bestFor: string;
  applyUrl: string; // placeholder link
  eligibilityCriteria: string[];
  pros: string[];
  cons: string[];
  fitScore?: number;
}

const LOAN_PRODUCTS: LoanProduct[] = [
  {
    lender: "SBI",
    productName: "SBI Scholar Loan",
    maxAmount: "₹1.5 Cr (no collateral for premier institutes)",
    interestRate: "9.55% - 11.15%",
    collateralRequired: false, // for IITs/NITs/top institutes
    coSignerRequired: true,
    processingFee: "0%",
    moratorium: "Course duration + 12 months",
    repaymentPeriod: "15 years",
    bestFor: "Students from premier institutes (IIT, NIT, top 200 QS)",
    applyUrl: "https://sbi.co.in/web/personal-banking/loans/education-loans",
    eligibilityCriteria: ["Indian citizen", "Admission to reputed university", "Co-borrower required"],
    pros: ["Lowest interest rates", "No collateral for premier institutes", "Government bank security"],
    cons: ["Slow processing", "Strict eligibility", "Requires premium institute admission letter"]
  },
  {
    lender: "HDFC Credila",
    productName: "HDFC Credila Education Loan",
    maxAmount: "Up to ₹75 Lakhs",
    interestRate: "10.25% - 13.5%",
    collateralRequired: false,
    coSignerRequired: true,
    processingFee: "0.5% - 1%",
    moratorium: "Course duration + 6 months",
    repaymentPeriod: "12 years",
    bestFor: "Fast processing, flexible collateral, wide university coverage",
    applyUrl: "https://www.hdfccredila.com",
    eligibilityCriteria: ["Indian citizen", "Admission to HDFC-approved universities", "Co-borrower required"],
    pros: ["Fast disbursement", "Wide university network", "Flexible documentation"],
    cons: ["Higher interest than SBI", "Processing fee applicable"]
  },
  {
    lender: "Avanse",
    productName: "Avanse Education Loan",
    maxAmount: "Up to ₹75 Lakhs",
    interestRate: "11% - 14%",
    collateralRequired: false,
    coSignerRequired: true,
    processingFee: "1% - 2%",
    moratorium: "Course duration + 6 months",
    repaymentPeriod: "10 years",
    bestFor: "Students with lower GPA or non-premier universities",
    applyUrl: "https://www.avanse.com",
    eligibilityCriteria: ["Indian citizen", "Valid admission letter", "Co-borrower required"],
    pros: ["Flexible eligibility", "Covers non-premier universities", "Quick processing"],
    cons: ["Higher interest rates", "Shorter repayment period"]
  },
  {
    lender: "MPOWER Financing",
    productName: "MPOWER International Student Loan",
    maxAmount: "$100,000 USD",
    interestRate: "12.99% - 14.98% (USD)",
    collateralRequired: false,
    coSignerRequired: false,
    processingFee: "0%",
    moratorium: "While studying",
    repaymentPeriod: "10 years",
    bestFor: "Students who cannot get a co-signer in India",
    applyUrl: "https://www.mpowerfinancing.com",
    eligibilityCriteria: ["Enrolled at MPOWER-approved US/Canada university", "No co-signer needed", "No collateral needed"],
    pros: ["No co-signer needed", "No collateral", "Build US credit history"],
    cons: ["High USD interest rate", "Limited to MPOWER-network schools", "USD repayment risk"]
  },
  {
    lender: "Prodigy Finance",
    productName: "Prodigy Finance Graduate Loan",
    maxAmount: "Up to $220,000 USD",
    interestRate: "7.5% - 14% (variable, USD)",
    collateralRequired: false,
    coSignerRequired: false,
    processingFee: "5% origination fee",
    moratorium: "6 months after graduation",
    repaymentPeriod: "7-20 years",
    bestFor: "Students at top-ranked global universities without Indian co-signer",
    applyUrl: "https://prodigyfinance.com",
    eligibilityCriteria: ["Enrolled at partner university (top 100)", "No co-signer needed", "Based on future earning potential"],
    pros: ["No co-signer", "High loan amounts", "Top university coverage"],
    cons: ["5% origination fee", "Requires top-ranked university", "USD exposure"]
  }
];

export function matchLoans(profile: {
  loanAmountINR: number;
  hasCoSigner: boolean;
  hasCollateral: boolean;
  universityRanking: string; // 'premier' | 'top100' | 'other'
  targetCountry: string;
}): (LoanProduct & { fitScore: number; recommendation: string })[] {
  return LOAN_PRODUCTS.map(product => {
    let score = 50;
    let recommendation = '';
    
    // Co-signer match
    if (!profile.hasCoSigner && product.coSignerRequired) score -= 20;
    if (!profile.hasCoSigner && !product.coSignerRequired) score += 20;
    
    // University ranking match
    if (profile.universityRanking === 'premier' && product.lender === 'SBI') score += 25;
    if (profile.universityRanking === 'top100' && ['Prodigy Finance', 'MPOWER'].includes(product.lender)) score += 15;
    
    // Collateral
    if (!profile.hasCollateral && !product.collateralRequired) score += 10;
    
    // Country-specific
    if (product.lender === 'MPOWER' && !['USA', 'Canada'].includes(profile.targetCountry)) score -= 30;
    
    if (score >= 70) recommendation = 'Best Match';
    else if (score >= 50) recommendation = 'Good Option';
    else recommendation = 'Consider if others unavailable';
    
    return { ...product, fitScore: Math.min(95, Math.max(20, score)), recommendation };
  }).sort((a, b) => b.fitScore - a.fitScore);
}

export function calculateEMI(principal: number, rateString: string, tenureYears: number): number {
  // Extract number from rate string (e.g., "9.55% - 11.15%" -> 10.3)
  const rates = rateString.match(/(\d+\.?\d*)/g);
  const rate = rates ? parseFloat(rates[0]) : 10.5;
  
  const monthlyRate = rate / (12 * 100);
  const months = tenureYears * 12;
  
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(emi);
}

export async function triggerLoanConversion(userId: string, universityName: string, admitProbability: number) {
  try {
     const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', userId).single();
     
     const conversionPrompt = `You are the EduVerse Loan Conversion Agent. 
Student ${profile?.name} has a ${admitProbability}% chance of admission to ${universityName}. 
Their expected cost is ~$${Math.round((profile?.budget_usd || 40000) * 1.2)}. 

Generate a personalized, encouraging loan suggestion (max 120 chars). Mention why now is the right time to lock in their matching loan for ${universityName}. No hashtags.`;
     
     const message = await generateWithGemini(conversionPrompt);
     
     await supabase.from('user_notifications').insert({
       user_id: userId,
       message: message.trim().replace(/^"(.*)"$/, '$1').slice(0, 120),
       type: 'loan_conversion',
       module: 'loan-estimator',
       read: false
     });
     return true;
  } catch (err) {
     console.error("Loan Conversion Trigger Error:", err);
     return false;
  }
}
