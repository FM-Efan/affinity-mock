// affinity_mock.ts
// 运行：deno run --allow-write affinity_mock.ts

import { faker } from "https://esm.sh/@faker-js/faker@8.4.1";

// ---------- 常量 ----------
const ORG_COUNT = 160;
const PERSON_COUNT = 200;
const OPPORTUNITY_COUNT = 150;

// ---------- 类型定义 ----------
interface Organization {
  id: number;
  name: string;
  domain: string;
  domains: string[];
  global: boolean;
}

interface Person {
  id: number;
  type: number; // 0: External, 1: Internal
  first_name: string;
  last_name: string;
  primary_email: string;
  emails: string[];
  organization_ids: number[];
}

interface Opportunity {
  id: number;
  name: string;
  organization_ids: number[];
  person_ids: number[];
  list_entries: Array<{ id: number; list_id: number }>;
}

// ---------- 生成逻辑 ----------
function generateData() {
  const organizations: Organization[] = [];
  const persons: Person[] = [];
  const opportunities: Opportunity[] = [];

  // 1. 生成组织
  for (let i = 1; i <= ORG_COUNT; i++) {
    const companyName = faker.company.name();
    const domain = faker.internet.domainName();
    organizations.push({
      id: 1000 + i,
      name: companyName,
      domain: domain,
      domains: [domain],
      global: faker.datatype.boolean(0.3),
    });
  }

  // 2. 生成人员
  for (let i = 1; i <= PERSON_COUNT; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName });

    // 随机关联 1~2 个组织
    const assignedOrgs = faker.helpers.arrayElements(organizations, { min: 1, max: 2 }).map((o) => o.id);

    persons.push({
      id: 2000 + i,
      type: faker.helpers.arrayElement([0, 1]),
      first_name: firstName,
      last_name: lastName,
      primary_email: email,
      emails: [email],
      organization_ids: assignedOrgs,
    });
  }

  // 3. 生成机会（Deals）- FIXED: 处理空数组情况
  for (let i = 1; i <= OPPORTUNITY_COUNT; i++) {
    const org = faker.helpers.arrayElement(organizations);

    // 找到属于该组织的人员（可能为空）
    let candidates = persons.filter((p) => p.organization_ids.includes(org.id));

    // FIX: 如果该组织下没有人员，则回退到所有人员
    if (candidates.length === 0) {
      candidates = persons;
    }

    const person = faker.helpers.arrayElement(candidates);

    opportunities.push({
      id: 3000 + i,
      name: `${org.name} - ${faker.helpers.arrayElement(["Series A", "Equity Round", "Strategic Partnership"])}`,
      organization_ids: [org.id],
      person_ids: person ? [person.id] : [],
      list_entries: [{ id: 5000 + i, list_id: 888 }],
    });
  }

  // 4. 写入文件
  const db = {
    organizations,
    persons,
    opportunities,
    updated_at: new Date().toISOString(),
  };

  Deno.writeTextFileSync("affinity_db.json", JSON.stringify(db, null, 2));
  console.log("✅ affinity_db.json generated successfully!");
}

generateData();
