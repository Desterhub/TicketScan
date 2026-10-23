import { NextRequest, NextResponse } from 'next/server';
import { getPolicies, getClaims, saveClaim } from '@/lib/tixsurance';

export async function GET(req: NextRequest) {
  const policies = getPolicies();
  const claims = getClaims();

  const totalInsuredValue = policies.reduce((acc, p) => acc + (p.ticketFare || 0), 0);
  const totalPremiumsCollected = policies.reduce((acc, p) => acc + (p.totalPremiumPaid || 0), 0);
  const localPoliciesCount = policies.filter((p) => p.policyType === 'LOCAL').length;
  const outstationPoliciesCount = policies.filter((p) => p.policyType === 'OUTSTATION').length;

  const pendingBandReceipts = claims.filter(
    (c) => c.policyType === 'LOCAL' && c.wristbandStatus === 'IN_TRANSIT'
  ).length;
  const underReviewCount = claims.filter((c) => c.claimStatus === 'UNDER_REVIEW').length;
  const approvedClaimsCount = claims.filter((c) => c.claimStatus === 'APPROVED').length;

  return NextResponse.json({
    metrics: {
      totalPolicies: policies.length,
      totalInsuredValue,
      totalPremiumsCollected,
      localPoliciesCount,
      outstationPoliciesCount,
      totalClaims: claims.length,
      pendingBandReceipts,
      underReviewCount,
      approvedClaimsCount,
    },
    policies,
    claims,
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { claimId, action, notes, rejectionReason } = body;

    const claims = getClaims();
    const claim = claims.find((c) => c.id === claimId);

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    if (action === 'VERIFY_BAND') {
      claim.wristbandStatus = 'VERIFIED';
      claim.bandSerialVerified = true;
      claim.claimStatus = 'UNDER_REVIEW';
      claim.adminNotes = notes || 'Physical wristband received at Empressa 14 Hub. Intact barrel-lock verified. QR code scanned and verified valid.';
    } else if (action === 'APPROVE') {
      claim.claimStatus = 'APPROVED';
      claim.wristbandStatus = 'VERIFIED';
      claim.adminNotes = notes || 'Claim approved. Zero fraud audit passed. Payout scheduled.';
    } else if (action === 'REJECT') {
      claim.claimStatus = 'REJECTED';
      claim.rejectionReason = rejectionReason || 'Tampered wristband / invalid documentation';
      claim.adminNotes = notes || 'Claim rejected by forensic team.';
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    saveClaim(claim);
    return NextResponse.json({ success: true, claim });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update claim' }, { status: 500 });
  }
}
