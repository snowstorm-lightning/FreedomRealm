import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templateDir = process.env.AI_HRMS_TEMPLATE_DIR ?? "config/templates";

function toWorkspacePath(relativePath) {
  const absolutePath = path.resolve(repoRoot, relativePath);
  const relative = path.relative(repoRoot, absolutePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Template path must stay inside the workspace: ${relativePath}`);
  }
  return absolutePath;
}

async function pathExists(absolutePath) {
  try {
    await stat(absolutePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

function addIssue(collection, code, message, file) {
  collection.push({ code, message, file });
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateNonEmptyString(errors, value, field, file) {
  if (!isNonEmptyString(value)) {
    addIssue(errors, "invalid_template_field", `${field} must be a non-empty string.`, file);
  }
}

function validateNonEmptyArray(errors, value, field, file) {
  if (!Array.isArray(value) || value.length === 0) {
    addIssue(errors, "invalid_template_field", `${field} must be a non-empty array.`, file);
  }
}

function normalizeToken(value) {
  return value.toLowerCase().replace(/[\s-]+/gu, "_");
}

function containsAny(values, candidates) {
  if (!Array.isArray(values)) {
    return false;
  }
  const normalized = new Set(values.filter(isNonEmptyString).map(normalizeToken));
  return candidates.some((candidate) => normalized.has(normalizeToken(candidate)));
}

function validateToolContracts(errors, template, file) {
  if (!Array.isArray(template.toolContracts) || template.toolContracts.length === 0) {
    return;
  }

  const requiredFields = [
    "toolName",
    "description",
    "inputSchemaRef",
    "outputSchemaRef",
    "requiredPermissions",
    "riskLevel",
    "allowedActorTypes",
    "allowedEnvironments",
    "autoExecute",
    "budgetLimit",
    "auditTags"
  ];

  for (const [index, contract] of template.toolContracts.entries()) {
    if (!isPlainObject(contract)) {
      addIssue(errors, "invalid_tool_contract", `toolContracts.${index} must be an object.`, file);
      continue;
    }

    for (const field of requiredFields) {
      if (!(field in contract)) {
        addIssue(errors, "invalid_tool_contract", `toolContracts.${index}.${field} is required.`, file);
      }
    }

    validateNonEmptyString(errors, contract.toolName, `toolContracts.${index}.toolName`, file);
    validateNonEmptyString(errors, contract.description, `toolContracts.${index}.description`, file);
    validateNonEmptyString(errors, contract.inputSchemaRef, `toolContracts.${index}.inputSchemaRef`, file);
    validateNonEmptyString(errors, contract.outputSchemaRef, `toolContracts.${index}.outputSchemaRef`, file);
    validateNonEmptyString(errors, contract.riskLevel, `toolContracts.${index}.riskLevel`, file);
    validateNonEmptyArray(errors, contract.requiredPermissions, `toolContracts.${index}.requiredPermissions`, file);
    validateNonEmptyArray(errors, contract.allowedActorTypes, `toolContracts.${index}.allowedActorTypes`, file);
    validateNonEmptyArray(errors, contract.allowedEnvironments, `toolContracts.${index}.allowedEnvironments`, file);
    validateNonEmptyArray(errors, contract.auditTags, `toolContracts.${index}.auditTags`, file);

    if (!["low", "medium", "high"].includes(contract.riskLevel)) {
      addIssue(errors, "invalid_tool_contract_risk", `toolContracts.${index}.riskLevel is invalid.`, file);
    }

    if (contract.autoExecute !== true && contract.autoExecute !== false) {
      addIssue(errors, "invalid_tool_contract_auto_execute", `toolContracts.${index}.autoExecute must be boolean.`, file);
    }

    if (["medium", "high"].includes(contract.riskLevel) && contract.autoExecute !== false) {
      addIssue(
        errors,
        "unsafe_tool_contract_auto_execute",
        `toolContracts.${index} medium/high risk tools must not autoExecute in Demo Mode templates.`,
        file
      );
    }

    if (
      containsAny(contract.allowedEnvironments, [
        "prod",
        "production",
        "enterprise",
        "live",
        "real_connector"
      ])
    ) {
      addIssue(
        errors,
        "unsafe_tool_contract_environment",
        `toolContracts.${index}.allowedEnvironments must stay within dev/ci for Demo Mode templates.`,
        file
      );
    }

    if (!isPlainObject(contract.budgetLimit)) {
      addIssue(errors, "invalid_tool_contract_budget", `toolContracts.${index}.budgetLimit must be an object.`, file);
    } else {
      validateNonEmptyString(errors, contract.budgetLimit.currency, `toolContracts.${index}.budgetLimit.currency`, file);
      if (typeof contract.budgetLimit.amount !== "number" || !Number.isFinite(contract.budgetLimit.amount) || contract.budgetLimit.amount <= 0) {
        addIssue(errors, "invalid_tool_contract_budget", `toolContracts.${index}.budgetLimit.amount must be a positive number.`, file);
      }
    }
  }
}

function validateFailureSample(errors, template, file) {
  if (!isPlainObject(template.failureSample)) {
    addIssue(errors, "missing_failure_sample", "failureSample must be an object.", file);
    return;
  }

  validateNonEmptyString(errors, template.failureSample.failureType, "failureSample.failureType", file);
  validateNonEmptyString(errors, template.failureSample.statusIfTriggered, "failureSample.statusIfTriggered", file);
  validateNonEmptyString(errors, template.failureSample.expectedBlockingPoint, "failureSample.expectedBlockingPoint", file);
  validateNonEmptyString(errors, template.failureSample.humanReviewStatus, "failureSample.humanReviewStatus", file);
  validateNonEmptyArray(errors, template.failureSample.reproducibleInputRefs, "failureSample.reproducibleInputRefs", file);
  validateNonEmptyString(errors, template.failureSample.recovery, "failureSample.recovery", file);

  if (template.failureSample.simulated !== true) {
    addIssue(errors, "invalid_failure_sample", "failureSample.simulated must be true for Demo Mode templates.", file);
  }

  if (template.failureSample.humanReviewStatus !== "requires_human_owner_review") {
    addIssue(
      errors,
      "invalid_failure_sample",
      "failureSample.humanReviewStatus must be requires_human_owner_review.",
      file
    );
  }
}

function validateEvaluationSamples(errors, template, file) {
  if (!Array.isArray(template.evaluationSamples) || template.evaluationSamples.length === 0) {
    addIssue(errors, "missing_evaluation_samples", "evaluationSamples must contain at least one sample.", file);
    return;
  }

  const requiredFields = [
    "sampleId",
    "purpose",
    "inputSummary",
    "inputRefs",
    "dataClassification",
    "purposeLimit",
    "retention",
    "allowedDataSources",
    "prohibitedDataSources",
    "expectedOutputs",
    "expectedGovernance",
    "failureModeCovered",
    "reportCardValue"
  ];

  for (const [index, sample] of template.evaluationSamples.entries()) {
    if (!isPlainObject(sample)) {
      addIssue(errors, "invalid_evaluation_sample", `evaluationSamples.${index} must be an object.`, file);
      continue;
    }

    for (const field of requiredFields) {
      if (!(field in sample)) {
        addIssue(errors, "invalid_evaluation_sample", `evaluationSamples.${index}.${field} is required.`, file);
      }
    }

    validateNonEmptyString(errors, sample.sampleId, `evaluationSamples.${index}.sampleId`, file);
    validateNonEmptyString(errors, sample.purpose, `evaluationSamples.${index}.purpose`, file);
    validateNonEmptyString(errors, sample.inputSummary, `evaluationSamples.${index}.inputSummary`, file);
    validateNonEmptyArray(errors, sample.inputRefs, `evaluationSamples.${index}.inputRefs`, file);
    validateNonEmptyString(errors, sample.dataClassification, `evaluationSamples.${index}.dataClassification`, file);
    validateNonEmptyString(errors, sample.purposeLimit, `evaluationSamples.${index}.purposeLimit`, file);
    validateNonEmptyString(errors, sample.retention, `evaluationSamples.${index}.retention`, file);
    validateNonEmptyArray(errors, sample.allowedDataSources, `evaluationSamples.${index}.allowedDataSources`, file);
    validateNonEmptyArray(errors, sample.prohibitedDataSources, `evaluationSamples.${index}.prohibitedDataSources`, file);
    validateNonEmptyArray(errors, sample.expectedOutputs, `evaluationSamples.${index}.expectedOutputs`, file);
    validateNonEmptyArray(errors, sample.expectedGovernance, `evaluationSamples.${index}.expectedGovernance`, file);
    validateNonEmptyString(
      errors,
      sample.failureModeCovered,
      `evaluationSamples.${index}.failureModeCovered`,
      file
    );
    validateNonEmptyString(errors, sample.reportCardValue, `evaluationSamples.${index}.reportCardValue`, file);

    if (
      isNonEmptyString(sample.failureModeCovered) &&
      isNonEmptyString(template.failureSample?.failureType) &&
      sample.failureModeCovered !== template.failureSample.failureType
    ) {
      addIssue(
        errors,
        "evaluation_failure_mismatch",
        `evaluationSamples.${index}.failureModeCovered must match failureSample.failureType.`,
        file
      );
    }

    if (
      isNonEmptyString(sample.dataClassification) &&
      isNonEmptyString(template.dataClassification) &&
      sample.dataClassification !== template.dataClassification
    ) {
      addIssue(
        errors,
        "evaluation_data_classification_mismatch",
        `evaluationSamples.${index}.dataClassification must match template dataClassification.`,
        file
      );
    }

    if (
      containsAny(sample.allowedDataSources, [
        "live_model",
        "real_connector",
        "real_connector_credentials",
        "secret",
        "production_data",
        "sensitive_raw_text"
      ])
    ) {
      addIssue(
        errors,
        "unsafe_evaluation_sample_source",
        `evaluationSamples.${index}.allowedDataSources must not require live models, real connectors, secrets, or production data.`,
        file
      );
    }

    for (const prohibited of ["secret", "production_data", "real_connector_credentials"]) {
      if (!containsAny(sample.prohibitedDataSources, [prohibited])) {
        addIssue(
          errors,
          "missing_prohibited_data_source",
          `evaluationSamples.${index}.prohibitedDataSources must include ${prohibited}.`,
          file
        );
      }
    }
  }
}

function validateTemplate(errors, template, file) {
  const requiredTopLevelFields = [
    "templateId",
    "templateVersion",
    "displayName",
    "runtimeMode",
    "taskGoal",
    "dataClassification",
    "redactionStatus",
    "sharePermission",
    "riskLevel",
    "skillRefs",
    "toolContracts",
    "mockModel",
    "failureSample",
    "evaluationSamples"
  ];

  for (const field of requiredTopLevelFields) {
    if (!(field in template)) {
      addIssue(errors, "missing_template_field", `${field} is required.`, file);
    }
  }

  const expectedTemplateId = path.basename(file, ".json");
  if (template.templateId !== expectedTemplateId) {
    addIssue(errors, "template_id_mismatch", `templateId must match filename ${expectedTemplateId}.`, file);
  }

  validateNonEmptyString(errors, template.templateVersion, "templateVersion", file);
  validateNonEmptyString(errors, template.displayName, "displayName", file);
  validateNonEmptyString(errors, template.taskGoal, "taskGoal", file);
  validateNonEmptyString(errors, template.dataClassification, "dataClassification", file);
  validateNonEmptyString(errors, template.redactionStatus, "redactionStatus", file);
  validateNonEmptyString(errors, template.sharePermission, "sharePermission", file);
  validateNonEmptyString(errors, template.riskLevel, "riskLevel", file);
  validateNonEmptyArray(errors, template.skillRefs, "skillRefs", file);
  validateNonEmptyArray(errors, template.toolContracts, "toolContracts", file);
  validateToolContracts(errors, template, file);

  if (template.runtimeMode !== "Demo Mode") {
    addIssue(errors, "invalid_template_runtime", "runtimeMode must be Demo Mode for checked-in templates.", file);
  }

  if (!isPlainObject(template.mockModel)) {
    addIssue(errors, "invalid_mock_model", "mockModel must be an object.", file);
  } else {
    validateNonEmptyString(errors, template.mockModel.modelRouteId, "mockModel.modelRouteId", file);
    validateNonEmptyString(
      errors,
      template.mockModel.modelCapabilityProfileRef,
      "mockModel.modelCapabilityProfileRef",
      file
    );
    if (
      isNonEmptyString(template.mockModel.modelRouteId) &&
      !template.mockModel.modelRouteId.startsWith("mock.")
    ) {
      addIssue(errors, "invalid_mock_model", "mockModel.modelRouteId must use a mock. route.", file);
    }
  }

  validateFailureSample(errors, template, file);
  validateEvaluationSamples(errors, template, file);
}

const errors = [];
const absoluteTemplateDir = toWorkspacePath(templateDir);

if (!(await pathExists(absoluteTemplateDir))) {
  addIssue(errors, "missing_template_dir", `${templateDir} must exist.`, templateDir);
} else {
  const entries = await readdir(absoluteTemplateDir, { withFileTypes: true });
  const templateFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();

  if (templateFiles.length === 0) {
    addIssue(errors, "missing_templates", `${templateDir} must contain template JSON files.`, templateDir);
  }

  for (const templateFile of templateFiles) {
    const templatePath = path.join(templateDir, templateFile).split(path.sep).join("/");
    let template;
    try {
      template = JSON.parse(await readFile(path.join(absoluteTemplateDir, templateFile), "utf8"));
    } catch (error) {
      addIssue(errors, "invalid_template_json", error.message, templatePath);
      continue;
    }
    validateTemplate(errors, template, templatePath);
  }
}

for (const error of errors) {
  console.error(`[templates] FAIL ${error.file}: ${error.code}: ${error.message}`);
}

if (errors.length === 0) {
  console.log("[templates] ok");
}

process.exit(errors.length === 0 ? 0 : 1);
