import { NextRequest, NextResponse } from 'next/server';
import { calculateEMI, matchLoans } from '@/lib/loan-engine';
import { requireAuthAndCSRF } from '@/lib/csrf';

export async function POST(req: NextRequest) {
  try {
    const { session, error: authError } = await requireAuthAndCSRF(req);
    if (authError) return authError;

    const { amount, tenure } = await req.json();
    
    if (!amount || !tenure) {
      return NextResponse.json({ error: 'Amount and tenure are required' }, { status: 400 });
    }

    const products = matchLoans({ 
      loanAmountINR: amount || 2000000, 
      hasCoSigner: true, 
      hasCollateral: false, 
      universityRanking: 'top100',
      targetCountry: 'USA'
    });
    const primaryProduct = products[0];
    const emi = calculateEMI(amount, primaryProduct.interestRate, tenure);

    return NextResponse.json({ 
      emi, 
      matchedProducts: products,
      bestOffer: primaryProduct 
    });
  } catch (error) {
    console.error('Loan API Error:', error);
    return NextResponse.json({ error: 'Failed to generate loan estimate' }, { status: 500 });
  }
}
