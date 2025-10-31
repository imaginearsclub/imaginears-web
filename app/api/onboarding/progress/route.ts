import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import {
  getUserOnboardingProgress,
  completeTour,
  completeStep,
  trackFeatureUsage,
  dismissItem,
  updateOnboardingPreferences,
} from "@/lib/onboarding";

/**
 * GET /api/onboarding/progress
 * Get user's onboarding progress
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const progress = await getUserOnboardingProgress(session.user.id);

    return NextResponse.json({
      completedTours: progress.completedTours,
      completedSteps: progress.completedSteps,
      usedFeatures: progress.usedFeatures,
      dismissedTips: progress.dismissedTips,
      dismissedAnnouncements: progress.dismissedAnnouncements,
      showWelcomeTour: progress.showWelcomeTour,
      showTooltips: progress.showTooltips,
      showSpotlights: progress.showSpotlights,
      onboardingCompleted: progress.onboardingCompleted,
      completedAt: progress.completedAt,
    });
  } catch (error: any) {
    console.error("[Onboarding] Error fetching progress:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/onboarding/progress
 * Update onboarding progress
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, tourId, stepId, featureId, itemId, itemType, preferences } = body;

    switch (action) {
      case "complete-tour":
        if (!tourId) {
          return NextResponse.json({ error: "tourId required" }, { status: 400 });
        }
        await completeTour(session.user.id, tourId);
        break;

      case "complete-step":
        if (!tourId || !stepId) {
          return NextResponse.json(
            { error: "tourId and stepId required" },
            { status: 400 }
          );
        }
        await completeStep(session.user.id, tourId, stepId);
        break;

      case "track-feature":
        if (!featureId) {
          return NextResponse.json({ error: "featureId required" }, { status: 400 });
        }
        await trackFeatureUsage(session.user.id, featureId);
        break;

      case "dismiss":
        if (!itemId || !itemType) {
          return NextResponse.json(
            { error: "itemId and itemType required" },
            { status: 400 }
          );
        }
        await dismissItem(session.user.id, itemId, itemType);
        break;

      case "update-preferences":
        if (!preferences) {
          return NextResponse.json({ error: "preferences required" }, { status: 400 });
        }
        await updateOnboardingPreferences(session.user.id, preferences);
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updated = await getUserOnboardingProgress(session.user.id);

    return NextResponse.json({
      success: true,
      progress: {
        completedTours: updated.completedTours,
        completedSteps: updated.completedSteps,
        usedFeatures: updated.usedFeatures,
        onboardingCompleted: updated.onboardingCompleted,
      },
    });
  } catch (error: any) {
    console.error("[Onboarding] Error updating progress:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update progress" },
      { status: 500 }
    );
  }
}

