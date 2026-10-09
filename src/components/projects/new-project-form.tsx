"use client";

import { useActionState, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Home, MapPin, Sparkles } from "lucide-react";
import { createProjectAction, type ProjectFormState } from "@/lib/actions/projects";
import { projectTypes } from "@/lib/constants";
import { AddressLocator, type LocatedAddress } from "@/components/maps/address-locator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ProjectFormState = {};

export function NewProjectForm() {
  const [step, setStep] = useState(1);
  const [projectType, setProjectType] = useState("New Construction");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [county, setCounty] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [googlePlaceId, setGooglePlaceId] = useState("");
  const [formattedAddress, setFormattedAddress] = useState("");
  const [description, setDescription] = useState("");
  const [formState, formAction, pending] = useActionState(
    createProjectAction,
    initialState,
  );

  const canGoNext = useMemo(() => {
    if (step === 1) return Boolean(projectType);
    if (step === 2) return addressLine1 && city && stateValue && postalCode;
    if (step === 3) return description.length >= 8;
    return true;
  }, [addressLine1, city, description, postalCode, projectType, stateValue, step]);

  function handleLocatedAddress(address: LocatedAddress) {
    setAddressLine1(address.addressLine1);
    setCity(address.city);
    setStateValue(address.state);
    setPostalCode(address.postalCode);
    setCounty(address.county);
    setLatitude(address.latitude);
    setLongitude(address.longitude);
    setGooglePlaceId(address.googlePlaceId);
    setFormattedAddress(address.formattedAddress);
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Create a project</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Four quick steps to open a Bouldrr workspace.
            </p>
          </div>
          <Badge variant="secondary">Step {step} of 4</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <input name="projectType" type="hidden" value={projectType} />
          <input name="addressLine1" type="hidden" value={addressLine1} />
          <input name="city" type="hidden" value={city} />
          <input name="state" type="hidden" value={stateValue} />
          <input name="postalCode" type="hidden" value={postalCode} />
          <input name="county" type="hidden" value={county} />
          <input name="latitude" type="hidden" value={latitude} />
          <input name="longitude" type="hidden" value={longitude} />
          <input name="googlePlaceId" type="hidden" value={googlePlaceId} />
          <input name="formattedAddress" type="hidden" value={formattedAddress} />
          <input name="description" type="hidden" value={description} />

          {step === 1 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Home className="size-5" />
                <h2 className="text-lg font-medium">What are you working on?</h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {projectTypes.map((type) => (
                  <button
                    className={`rounded-lg border p-4 text-left text-sm transition hover:border-foreground ${
                      projectType === type
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card"
                    }`}
                    key={type}
                    onClick={() => setProjectType(type)}
                    type="button"
                  >
                    {type}
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="size-5" />
                <h2 className="text-lg font-medium">Property address</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="visibleAddress">Street address</Label>
                  <Input
                    id="visibleAddress"
                    value={addressLine1}
                    onChange={(event) => setAddressLine1(event.target.value)}
                    placeholder="123 Main St"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visibleCity">City</Label>
                  <Input
                    id="visibleCity"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visibleState">State</Label>
                  <Input
                    id="visibleState"
                    value={stateValue}
                    onChange={(event) => setStateValue(event.target.value)}
                    placeholder="CA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visiblePostalCode">ZIP</Label>
                  <Input
                    id="visiblePostalCode"
                    value={postalCode}
                    onChange={(event) => setPostalCode(event.target.value)}
                  />
                </div>
              </div>
              <AddressLocator
                addressLine1={addressLine1}
                city={city}
                onLocate={handleLocatedAddress}
                postalCode={postalCode}
                stateValue={stateValue}
              />
            </section>
          )}

          {step === 3 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5" />
                <h2 className="text-lg font-medium">What do you want to do?</h2>
              </div>
              <div className="space-y-2">
                <Label htmlFor="visibleDescription">Project description</Label>
                <Textarea
                  id="visibleDescription"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="I want to buy this lot and build a duplex."
                  rows={6}
                />
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Check className="size-5" />
                <h2 className="text-lg font-medium">Review and create</h2>
              </div>
              <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
                <p><span className="font-medium">Type:</span> {projectType}</p>
                <p>
                  <span className="font-medium">Property:</span> {addressLine1}, {city},{" "}
                  {stateValue} {postalCode}
                </p>
                {formattedAddress && (
                  <p>
                    <span className="font-medium">Located:</span> {formattedAddress}
                  </p>
                )}
                {latitude && longitude && (
                  <p>
                    <span className="font-medium">Coordinates:</span> {latitude},{" "}
                    {longitude}
                  </p>
                )}
                <p><span className="font-medium">Goal:</span> {description}</p>
              </div>
            </section>
          )}

          {formState.message && (
            <Alert>
              <AlertDescription>{formState.message}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button
              disabled={step === 1}
              onClick={() => setStep((current) => Math.max(1, current - 1))}
              type="button"
              variant="outline"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
            {step < 4 ? (
              <Button
                disabled={!canGoNext}
                onClick={() => setStep((current) => Math.min(4, current + 1))}
                type="button"
              >
                Next
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button disabled={pending} type="submit">
                {pending ? "Creating..." : "Create project"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
